import { CONTRACTS_DATA } from './types'

export default function data(
  state = {
    [`${CONTRACTS_DATA}`]: null,
  },
  action
) {
  switch (action.type) {
    case CONTRACTS_DATA:
      return {
        ...state,
        [`${CONTRACTS_DATA}`]: action.value
      }
    default:
      return state
  }
}