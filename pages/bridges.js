import { useRouter } from 'next/router'

import ChainInfo from '../components/crosschain/chain-info'
import Bridges from '../components/crosschain/bridges'
import SectionTitle from '../components/section-title'

import { networks } from '../lib/menus'

export default function PoolsIndex() {
  const router = useRouter()
  const { pathname, query } = { ...router }
  const { chain_id } = { ...query }
  const network = networks[networks.findIndex(network => network.id === chain_id)] || (pathname.startsWith('/[chain_id]') ? null : networks[0])

  return (
    <>
      <SectionTitle
        title="Bridges"
        subtitle={network?.title}
        right={<ChainInfo />}
        className="flex-col sm:flex-row items-start sm:items-center"
      />
      <Bridges />
    </>
  )
}