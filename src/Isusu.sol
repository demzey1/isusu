// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentId {
    function balanceOf(address owner) external view returns (uint256);
}

/// @title Isusu
/// @notice Permissionless rotating savings circles (Ajo/Esusu) settled in USDT.
/// @dev One deployment hosts many circles. There is no owner and no admin function.
///
///      Rules
///      -----
///      - Only an Agent ID holder (balanceOf > 0) may create a circle or join one.
///      - Every circle has exactly five seats and pays slot r in round r. It must
///        fill before its join deadline, chosen at creation as 1, 3 or 7 days.
///      - The contribution is exactly 1 or 2 USDT per round, so a pot is 5 or
///        10 USDT.
///      - Joining costs the round-1 contribution plus collateral of
///        `contribution * (5 - slot)`. Collateral is exactly the amount a member
///        still owes after receiving their payout, so it only secures rounds
///        after the payout.
///      - If the deadline passes and the circle is not full, anyone may call
///        `cancelCircle`. Every member then pulls a full refund of their round-1
///        contribution and collateral with `withdraw`.
///      - Members choose their slot on join. Slots are unique and final.
///      - A round closes as soon as every active member has paid. Otherwise
///        anyone may call `closeRound` after the deadline plus a 24h grace
///        period. After payout, unpaid rounds are charged from collateral.
///      - Before payout, collateral is not a payment method: a member who misses
///        a round is defaulted, forfeits their slot and their collateral goes to
///        the pool. This stops a member from spending their security, collecting
///        the pot and leaving.
///      - At the end the pool first makes every non-defaulting member whole
///        against what they paid in, then refunds any surplus pro rata.
///      - If a payout transfer fails, the pot is credited to that member's
///        withdrawable balance instead of reverting the settlement.
///      - After the final round every member withdraws their remaining credit.
contract Isusu is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Every circle has exactly five seats.
    uint8 public constant SLOTS = 5;
    /// @notice Allowed contributions: 1 USDT or 2 USDT (18 decimals).
    uint128 public constant ONE_USDT = 1e18;
    uint128 public constant TWO_USDT = 2e18;
    uint64 public constant GRACE_PERIOD = 24 hours;
    /// @notice Rounds and join windows are exactly 1, 3 or 7 days.
    uint64 public constant ONE_DAY = 1 days;
    uint64 public constant THREE_DAYS = 3 days;
    uint64 public constant SEVEN_DAYS = 7 days;

    IERC20 public immutable usdt;
    IAgentId public immutable agentId;

    uint256 public circleCount;

    struct Member {
        uint8 slot;
        bool defaulted;
        bool paid; // paid for the current round
        uint256 credit; // refundable collateral not yet slashed
        uint256 deposited; // USDT transferred in: join amount plus contributions
        uint256 received; // pots transferred to the member
        uint256 owed; // pot credited after a failed transfer, withdrawable
    }

    struct Circle {
        address creator;
        uint128 contribution;
        uint64 roundDuration;
        uint64 joinDeadline;
        uint64 deadline;
        uint256 pot;
        uint256 pool; // withheld funds used for compensation and refunds
        uint8 slots;
        uint8 joined;
        uint8 active;
        uint8 round;
        uint8 paidCount;
        bool finished;
        bool cancelled;
        mapping(uint8 slot => address) slotOwner;
        mapping(address member => Member) members;
        address[] memberList;
    }

    struct CircleView {
        address creator;
        uint128 contribution;
        uint64 roundDuration;
        uint64 joinDeadline;
        uint64 deadline;
        uint256 pot;
        uint256 pool;
        uint8 slots;
        uint8 joined;
        uint8 active;
        uint8 round;
        bool finished;
        bool cancelled;
    }

    mapping(uint256 id => Circle) private _circles;

    event CircleCreated(
        uint256 indexed id,
        address indexed creator,
        uint128 contribution,
        uint8 slots,
        uint64 roundDuration,
        uint64 joinDeadline
    );
    event Joined(uint256 indexed id, address indexed member, uint8 slot, uint256 amountPaid);
    event Started(uint256 indexed id);
    event RoundOpened(uint256 indexed id, uint8 round, uint64 deadline);
    event Contributed(uint256 indexed id, address indexed member, uint8 round);
    event RoundSettled(uint256 indexed id, uint8 round, address indexed recipient, uint256 pot);
    event Defaulted(uint256 indexed id, address indexed member, uint8 round);
    event Withdrawn(uint256 indexed id, address indexed member, uint256 amount);
    event Cancelled(uint256 indexed id);
    event PayoutDeferred(uint256 indexed id, uint8 round, address indexed member, uint256 amount);
    event AvatarSet(address indexed owner, uint8 avatar);

    error NotAgentHolder();
    error UnknownCircle();
    error BadContribution();
    error BadRoundDuration();
    error BadJoinDeadline();
    error BadAvatar();
    error CircleFull();
    error CircleFinished();
    error NotStarted();
    error BadSlot();
    error SlotTaken();
    error AlreadyMember();
    error NotMember();
    error AlreadyPaid();
    error NotOverdue();
    error NotFinished();
    error NothingToWithdraw();
    error JoinClosed();
    error JoinStillOpen();

    /// @notice Chosen avatar for a wallet, 0..15.
    mapping(address => uint8) private _avatar;

    constructor(IERC20 usdt_, IAgentId agentId_) {
        usdt = usdt_;
        agentId = agentId_;
    }

    // ---------------------------------------------------------------------
    // Circle lifecycle
    // ---------------------------------------------------------------------

    /// @notice Open a five-seat circle. `contribution` is 1 or 2 USDT and both
    ///         `roundDuration` and `joinWindow` are 1, 3 or 7 days.
    function createCircle(uint128 contribution, uint64 roundDuration, uint64 joinWindow) external returns (uint256 id) {
        if (agentId.balanceOf(msg.sender) == 0) revert NotAgentHolder();
        if (contribution != ONE_USDT && contribution != TWO_USDT) revert BadContribution();
        if (!_allowedPeriod(roundDuration)) revert BadRoundDuration();
        if (!_allowedPeriod(joinWindow)) revert BadJoinDeadline();

        uint64 joinDeadline = uint64(block.timestamp) + joinWindow;

        id = ++circleCount;
        Circle storage c = _circles[id];
        c.creator = msg.sender;
        c.contribution = contribution;
        c.roundDuration = roundDuration;
        c.joinDeadline = joinDeadline;
        c.slots = SLOTS;

        emit CircleCreated(id, msg.sender, contribution, SLOTS, roundDuration, joinDeadline);
    }

    /// @notice Take a payout slot. Pulls the round-1 contribution plus collateral.
    function join(uint256 id, uint8 slot) external nonReentrant {
        Circle storage c = _get(id);
        if (c.finished) revert CircleFinished();
        if (c.joined == c.slots) revert CircleFull();
        if (block.timestamp > c.joinDeadline) revert JoinClosed();
        if (agentId.balanceOf(msg.sender) == 0) revert NotAgentHolder();
        if (slot == 0 || slot > c.slots) revert BadSlot();
        if (c.slotOwner[slot] != address(0)) revert SlotTaken();
        if (c.members[msg.sender].slot != 0) revert AlreadyMember();

        uint256 collateral = uint256(c.contribution) * (c.slots - slot);
        uint256 amount = collateral + c.contribution;

        Member storage m = c.members[msg.sender];
        m.slot = slot;
        m.paid = true; // round 1 is paid at join
        m.credit = collateral;
        m.deposited = amount;

        c.slotOwner[slot] = msg.sender;
        c.memberList.push(msg.sender);
        c.joined += 1;
        c.active += 1;
        c.pot += c.contribution;
        c.paidCount += 1;

        usdt.safeTransferFrom(msg.sender, address(this), amount);

        emit Joined(id, msg.sender, slot, amount);

        if (c.joined == c.slots) {
            c.round = 1;
            emit Started(id);
            _settle(id, c);
        }
    }

    function contribute(uint256 id) external nonReentrant {
        Circle storage c = _get(id);
        if (c.finished) revert CircleFinished();
        if (c.joined < c.slots) revert NotStarted();

        Member storage m = c.members[msg.sender];
        if (m.slot == 0) revert NotMember();
        if (m.defaulted) revert NotMember();
        if (m.paid) revert AlreadyPaid();

        m.paid = true;
        m.deposited += c.contribution;
        c.pot += c.contribution;
        c.paidCount += 1;

        usdt.safeTransferFrom(msg.sender, address(this), c.contribution);

        emit Contributed(id, msg.sender, c.round);

        if (c.paidCount == c.active) {
            _settle(id, c);
        }
    }

    /// @notice Close an overdue round. Post-payout members are charged from
    ///         collateral; anyone still waiting for their pot is defaulted.
    function closeRound(uint256 id) external nonReentrant {
        Circle storage c = _get(id);
        if (c.finished) revert CircleFinished();
        if (c.joined < c.slots) revert NotStarted();
        if (block.timestamp <= uint256(c.deadline) + GRACE_PERIOD) revert NotOverdue();

        address[] storage list = c.memberList;

        for (uint256 i; i < list.length; ++i) {
            Member storage m = c.members[list[i]];
            if (m.defaulted || m.paid) continue;

            if (c.round <= m.slot) {
                // Before receiving the pot, collateral is not a payment method:
                // using it here would leave nothing securing the rounds after
                // payout, and the member could collect and walk away.
                m.defaulted = true;
                c.active -= 1;
                if (m.credit > 0) {
                    c.pool += m.credit;
                    m.credit = 0;
                }
                emit Defaulted(id, list[i], c.round);
                continue;
            }

            // After payout, collateral is exactly the remaining obligation.
            uint256 charge = c.contribution;
            uint256 fromCredit = m.credit < charge ? m.credit : charge;
            m.credit -= fromCredit;
            c.pot += fromCredit;
            m.paid = true;

            if (fromCredit < charge) {
                m.defaulted = true;
                c.active -= 1;
                emit Defaulted(id, list[i], c.round);
            }
        }

        _settle(id, c);
    }

    /// @notice Cancel a circle that never filled. Members then pull their full
    ///         round-1 contribution plus collateral with `withdraw`.
    function cancelCircle(uint256 id) external nonReentrant {
        Circle storage c = _get(id);
        if (c.finished) revert CircleFinished();
        if (c.joined == c.slots) revert CircleFull();
        if (block.timestamp <= c.joinDeadline) revert JoinStillOpen();

        c.finished = true;
        c.cancelled = true;
        c.pot = 0;
        c.pool = 0;
        c.active = 0;
        c.round = 0;

        address[] storage list = c.memberList;
        for (uint256 i; i < list.length; ++i) {
            Member storage m = c.members[list[i]];
            m.credit = m.deposited;
            m.deposited = 0;
            m.paid = false;
        }

        emit Cancelled(id);
    }

    /// @notice Withdraw refundable collateral and any pot credited after a
    ///         failed payout. A deferred pot is available immediately; ordinary
    ///         credit unlocks only when the circle ends.
    function withdraw(uint256 id) external nonReentrant {
        Circle storage c = _get(id);
        Member storage m = c.members[msg.sender];
        if (m.slot == 0) revert NotMember();

        uint256 amount = m.owed;
        m.owed = 0;

        if (c.finished) {
            amount += m.credit;
            m.credit = 0;
        } else if (amount == 0) {
            revert NotFinished();
        }

        if (amount == 0) revert NothingToWithdraw();

        usdt.safeTransfer(msg.sender, amount);
        emit Withdrawn(id, msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Settlement
    // ---------------------------------------------------------------------

    function _settle(uint256 id, Circle storage c) private {
        uint8 r = c.round;
        uint256 pot = c.pot;
        address recipient = c.slotOwner[r];

        c.pot = 0;
        c.paidCount = 0;

        if (recipient != address(0) && !c.members[recipient].defaulted) {
            if (pot > 0) {
                // A failed transfer must not wedge settlement. Keep the pot in
                // the contract and let the member pull it with `withdraw`.
                if (_tryTransfer(recipient, pot)) {
                    c.members[recipient].received += pot;
                } else {
                    c.members[recipient].owed += pot;
                    emit PayoutDeferred(id, r, recipient, pot);
                }
            }
            emit RoundSettled(id, r, recipient, pot);
        } else {
            // The slot owner defaulted (or no owner); keep the pot for compensation.
            c.pool += pot;
            emit RoundSettled(id, r, address(0), pot);
        }

        address[] storage list = c.memberList;
        uint256 len = list.length;
        for (uint256 i; i < len; ++i) {
            c.members[list[i]].paid = false;
        }

        if (r == c.slots) {
            c.finished = true;
            c.round = r + 1;
            _distributePool(c);
        } else {
            c.round = r + 1;
            c.deadline = uint64(block.timestamp) + c.roundDuration;
            emit RoundOpened(id, c.round, c.deadline);
        }
    }

    /// @dev Make every non-defaulting member whole first: a member whose pots and
    ///      remaining collateral are worth less than what they paid in is topped
    ///      up from the pool pro rata to their deficit. Any surplus is refunded
    ///      pro rata to what each non-defaulting member paid in.
    function _distributePool(Circle storage c) private {
        uint256 pool = c.pool;
        c.pool = 0;
        if (pool == 0) return;

        address[] storage list = c.memberList;
        uint256 len = list.length;

        uint256 totalDeficit;
        for (uint256 i; i < len; ++i) {
            Member storage m = c.members[list[i]];
            if (m.defaulted) continue;
            uint256 out = m.received + m.credit + m.owed;
            if (m.deposited > out) totalDeficit += m.deposited - out;
        }

        if (totalDeficit > 0) {
            uint256 available = pool < totalDeficit ? pool : totalDeficit;
            uint256 allocated;
            for (uint256 i; i < len; ++i) {
                Member storage m = c.members[list[i]];
                if (m.defaulted) continue;
                uint256 out = m.received + m.credit + m.owed;
                if (m.deposited <= out) continue;
                uint256 pay = ((m.deposited - out) * available) / totalDeficit;
                m.credit += pay;
                allocated += pay;
            }
            // Rounding dust falls through to the refund below.
            pool -= allocated;
        }

        if (pool == 0) return;

        uint256 weight;
        for (uint256 i; i < len; ++i) {
            Member storage m = c.members[list[i]];
            if (!m.defaulted) weight += m.deposited;
        }

        if (weight == 0) {
            // Every member defaulted; nothing sensible to refund against.
            if (len > 0) c.members[list[0]].credit += pool;
            return;
        }

        uint256 refunded;
        uint256 last;
        for (uint256 i; i < len; ++i) {
            Member storage m = c.members[list[i]];
            if (m.defaulted) continue;
            uint256 share = (pool * m.deposited) / weight;
            m.credit += share;
            refunded += share;
            last = i;
        }
        // Integer-division dust goes to the last non-defaulted member so the
        // circle's liabilities match its balance exactly.
        if (pool > refunded) c.members[list[last]].credit += pool - refunded;
    }

    // ---------------------------------------------------------------------
    // Avatars
    // ---------------------------------------------------------------------

    /// @notice Pick one of 16 avatars (0..15) for the caller.
    function setAvatar(uint8 id) external {
        if (id > 15) revert BadAvatar();
        _avatar[msg.sender] = id;
        emit AvatarSet(msg.sender, id);
    }

    function avatarOf(address owner) external view returns (uint8) {
        return _avatar[owner];
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getCircle(uint256 id) external view returns (CircleView memory v) {
        Circle storage c = _get(id);
        v = CircleView({
            creator: c.creator,
            contribution: c.contribution,
            roundDuration: c.roundDuration,
            joinDeadline: c.joinDeadline,
            deadline: c.deadline,
            pot: c.pot,
            pool: c.pool,
            slots: c.slots,
            joined: c.joined,
            active: c.active,
            round: c.round,
            finished: c.finished,
            cancelled: c.cancelled
        });
    }

    function getMember(uint256 id, address who) external view returns (Member memory) {
        return _get(id).members[who];
    }

    function slotOwner(uint256 id, uint8 slot) external view returns (address) {
        return _get(id).slotOwner[slot];
    }

    function memberCount(uint256 id) external view returns (uint256) {
        return _get(id).memberList.length;
    }

    function memberAt(uint256 id, uint256 index) external view returns (address) {
        return _get(id).memberList[index];
    }

    /// @notice USDT the contract is holding on behalf of a circle.
    function circleBalance(uint256 id) external view returns (uint256) {
        Circle storage c = _get(id);
        uint256 obligations = c.pot + c.pool;
        address[] storage list = c.memberList;
        for (uint256 i; i < list.length; ++i) {
            obligations += c.members[list[i]].credit + c.members[list[i]].owed;
        }
        return obligations;
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _get(uint256 id) private view returns (Circle storage) {
        if (id == 0 || id > circleCount) revert UnknownCircle();
        return _circles[id];
    }

    function _allowedPeriod(uint64 period) private pure returns (bool) {
        return period == ONE_DAY || period == THREE_DAYS || period == SEVEN_DAYS;
    }

    /// @dev USDT returns a bool; a revert or false both mean "not paid".
    function _tryTransfer(address to, uint256 amount) private returns (bool) {
        try usdt.transfer(to, amount) returns (bool ok) {
            return ok;
        } catch {
            return false;
        }
    }
}
