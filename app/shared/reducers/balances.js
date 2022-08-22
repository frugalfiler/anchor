import { get, set } from 'dot-prop-immutable';
import { map, reduce } from 'lodash';
import { Asset } from '@greymass/eosio';

import * as types from '../actions/types';

const initialState = {
  __contracts: {
    EOS: 'eosio.token'
  }
};

export default function balances(state = initialState, action) {
  switch (action.type) {
    case types.CLEAR_ACCOUNT_CACHE:
    case types.CLEAR_BALANCE_CACHE:
    case types.RESET_ALL_STATES: {
      return initialState;
    }
    case types.SYSTEM_GET_ACCOUNT_SUCCESS: {
      let modified;
      const { connection, results } = action.payload;
      if (results && results.core_liquid_balance) {
        const account = action.payload.account.replace(/\./g, '\\.');
        const newBalances = Object.assign({}, state[action.payload.account]);
        const tokenSymbol = `${connection.tokenPrecision || 4},${connection.chainSymbol}`;
        if (results.core_liquid_balance) {
          newBalances[`${connection.tokenContract.toUpperCase()}-${connection.chainSymbol.toUpperCase()}`] = Asset.from(results.core_liquid_balance, tokenSymbol).value;
        } else {
          newBalances[`${connection.tokenContract.toUpperCase()}-${connection.chainSymbol.toUpperCase()}`] = Asset.from(0, tokenSymbol).value;
        }
        modified = set(state, account, newBalances);
        const balanceKey = `${connection.tokenContract.toUpperCase()}-${connection.chainSymbol.toUpperCase()}`.replace(/\./g, '\\.')
        modified = set(modified, `__contracts.${balanceKey}`, {
          contract: connection.tokenContract,
          precision: connection.tokenPrecision,
        });
        return modified;
      }
      return state;
    }
    case types.SYSTEM_GET_ACCOUNT_BALANCES_SUCCESS: {
      let modified;
      const newBalances = Object.assign({}, state[action.payload.account], action.payload.tokens);
      const newPrecisions = Object.assign({}, state.__contracts, reduce(
        action.payload.results,
        (res, { code, symbol }) => ({
          ...res,
          ...{
            [`${code.toUpperCase()}-${symbol.toUpperCase()}`.replace(/\./g, '\\.')]: {
              contract: code,
              precision: {
                [symbol]: get(action, `payload.precisions.${symbol}`, 4)
              }
            }
          }
        }), {}
      ));
      const account = action.payload.account.replace(/\./g, '\\.');
      modified = set(state, account, newBalances);
      modified = set(modified, '__contracts', newPrecisions);
      return modified;
    }
    case types.SYSTEM_GET_ACCOUNT_BALANCE_SUCCESS: {
      const {
        account_name,
        contract,
        precision,
        symbol,
        tokens
      } = action.payload;
      let modified;
      const account = account_name.replace(/\./g, '\\.');
      const modifiedTokens = {}
      Object.keys(tokens).map(token => {
        modifiedTokens[`${contract.toUpperCase()}-${token.toUpperCase()}`] = tokens[token]
      })
      modified = set(state, account, Object.assign({}, state[account_name], modifiedTokens));
      if (precision[symbol.toUpperCase()] !== undefined) {
        const balanceKey = `${contract.toUpperCase()}-${symbol.toUpperCase()}`.replace(/\./g, '\\.')
        modified = set(modified, `__contracts.${balanceKey}`, { contract, precision });
      }
      return modified;
    }
    default: {
      return state;
    }
  }
}
