import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import _ from 'lodash'
import { Img } from 'react-image'
import StackGrid from 'react-stack-grid'
import { MdOutlineRouter } from 'react-icons/md'
import { TiArrowRight } from 'react-icons/ti'

import Copy from '../../copy'
import Widget from '../../widget'

import { networks } from '../../../lib/menus'
import { currency_symbol } from '../../../lib/object/currency'
import { numberFormat, ellipseAddress } from '../../../lib/utils'

export default function Routers() {
	const { contracts, assets } = useSelector(state => ({ contracts: state.contracts, assets: state.assets }), shallowEqual)
  const { contracts_data } = { ...contracts }
  const { assets_data } = { ...assets }

  const [routers, setRouters] = useState(null)

  useEffect(() => {
    if (assets_data) {
      const data = _.orderBy(Object.entries(
        _.groupBy(Object.values(assets_data).flatMap(asset_data => asset_data.map(asset => {
          return {
            ...asset,
            data: contracts_data?.find(contract => contract.id === asset.contract_address)?.data,
          }
        }).map(asset => {
          return {
            ...asset,
            normalize_amount: asset?.data?.contract_decimals && (asset.amount / Math.pow(10, asset.data.contract_decimals)),
          }
        }).map(asset => {
          return {
            ...asset,
            value: typeof asset?.normalize_amount === 'number' && typeof asset?.data?.prices?.[0]?.price === 'number' && (asset.normalize_amount * asset.data.prices[0].price),
          }
        })), 'router.id')
      ).map(([key, value]) => {
        return {
          router_id: key,
          assets: _.groupBy(_.orderBy(value, ['value'], ['desc']), 'chain_data.id'),
         }
      }).map(assets => {
        return {
          ...assets,
          liquidity: assets &&_.sumBy(Object.values(assets.assets), 'value'),
        }
      }), ['liquidity'], ['desc'])

      setRouters(data)
    }
  }, [contracts_data, assets_data])

  const routersComponent = routers?.map((router, i) => (
    <Widget
      key={i}
      title={<div className="flex items-center text-gray-400 dark:text-gray-200 font-medium space-x-1">
        <MdOutlineRouter size={20} className="mb-0.5" />
        <span>Router</span>
        <Copy
          text={router?.router_id}
          copyTitle={<span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
            {ellipseAddress(router?.router_id, 10)}
          </span>}
        />
      </div>}
    >
      <div className="grid grid-flow-row grid-cols-2 sm:grid-cols-3 gap-0 mt-3 mb-2">
        {router?.assets && Object.values(router.assets).flatMap(assets => assets).map((asset, j) => (
          <div key={j}>
            {asset?.data ?
              <div className={`min-h-full border ${asset?.chain_data?.color?.border} p-2 sm:p-3`}>
                <div className="space-y-0.5">
                  {asset?.data && (
                    <div className="flex">
                      {asset.data.logo_url && (
                        <Img
                          src={asset.data.logo_url}
                          alt=""
                          className="w-5 h-5 rounded-full mr-1"
                        />
                      )}
                      <div>
                        <div className="sm:hidden text-2xs font-medium">{asset.data.contract_name}</div>
                        <div className="hidden sm:block text-xs font-semibold">{asset.data.contract_name}</div>
                        {/*<div className="text-gray-600 dark:text-gray-400 text-2xs font-normal">{asset.data.contract_ticker_symbol}</div>*/}
                        {asset?.id && (
                          <div className="min-w-max flex items-center space-x-1">
                            <Copy
                              size={14}
                              text={asset.id.replace(`-${router.router_id}`, '')}
                              copyTitle={<span className="text-2xs font-medium">
                                {ellipseAddress(asset.id.replace(`-${router.router_id}`, ''), 5)}
                              </span>}
                            />
                            {asset?.chain_data?.explorer?.url && (
                              <a
                                href={`${asset.chain_data.explorer.url}${asset.chain_data.explorer.contract_path?.replace('{address}', asset.id.replace(`-${router.router_id}`, ''))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-white "
                              >
                                {asset.chain_data.explorer.icon ?
                                  <img
                                    src={asset.chain_data.explorer.icon}
                                    alt=""
                                    className="w-4 h-4 rounded-full opacity-50 hover:opacity-100"
                                  />
                                  :
                                  <TiArrowRight size={16} className="transform -rotate-45" />
                                }
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {asset?.chain_data?.icon && (
                        <Link href={`/${asset.chain_data.id}`}>
                          <a
                            className="hidden sm:block min-w-max bg-white w-3 sm:w-5 h-3 sm:h-5 rounded-lg relative -top-2 -right-2 ml-auto"
                          >
                            <img
                              src={asset.chain_data.icon}
                              alt=""
                              className="w-3 sm:w-5 h-3 sm:h-5 rounded-lg"
                            />
                          </a>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-center my-3">
                  {/*<div className="uppercase text-gray-400 dark:text-gray-500 text-2xs">Liquidity</div>*/}
                  <div>
                    <span className="font-mono text-base font-semibold mr-1.5">{asset?.normalize_amount ? numberFormat(asset.normalize_amount, '0,0') : asset?.amount && !(asset?.data) ? numberFormat(asset.amount / Math.pow(10, asset?.chain_data?.currency?.decimals), '0,0') : '-'}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{asset?.data?.contract_ticker_symbol}</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">~{currency_symbol}{typeof asset?.value === 'number' ? numberFormat(asset.value, '0,0') : ' -'}</div>
                </div>
              </div>
              :
              <div className="skeleton w-full" style={{ height: '9.5rem', borderRadius: 0 }} />
            }
          </div>
        ))}
      </div>
    </Widget>
  ))

  return (
    <>
      <StackGrid
        columnWidth={620}
        gutterWidth={12}
        gutterHeight={12}
        className="hidden sm:block"
      >
        {routersComponent}
      </StackGrid>
      <div className="block sm:hidden space-y-3">
        {routersComponent}
      </div>
    </>
  )
}