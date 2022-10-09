// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./IERC20.sol";

interface IAPWineIBT is IERC20 {
    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) external;

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @notice Returns the current balance of one user (without the claimable amount)
     * @param account the address of the account to check the balance of
     * @return the current apwibt balance of this address
     */
    function recordedBalanceOf(address account) external view returns (uint256);

    /**
     * @notice Returns the current balance of one user including the apwibt that were not claimed yet
     * @param account the address of the account to check the balance of
     * @return the total apwibt balance of one address
     */
    function balanceOf(address account)
        external
        view
        override
        returns (uint256);

    /**
     * @notice Getter for the future vault link to this apwibt
     * @return the address of the future vault
     */
    function futureVault() external view returns (address);
}
