import { useState, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import _ from 'lodash'
import moment from 'moment'
import {
  ResponsiveContainer,
  AreaChart,
  linearGradient,
  stop,
  XAxis,
  Area,
} from 'recharts'

import { currency_symbol } from '../../../../lib/object/currency'
import { daily_time_range, day_s } from '../../../../lib/object/timely'

import { TOTAL_DATA } from '../../../../reducers/types'

export default function TimelyVolume({ theVolume, setTheVolume }) {
  const dispatch = useDispatch()
  const { timely } = useSelector(state => ({ timely: state.timely }), shallowEqual)
  const { timely_data } = { ...timely }

  const [data, setData] = useState(null)

  useEffect(() => {
    const today = moment().utc().startOf('day')

    let _data = timely_data && _.orderBy(Object.entries(_.groupBy(Object.values(timely_data).flatMap(timely => timely), 'dayStartTimestamp')).map(([key, value]) => {
      return {
        assets: value && _.groupBy(value, 'chain_data.id'),
        time: Number(key),
        volume: _.sumBy(value, 'normalize_volume'),
        tx_count: _.sumBy(value, 'txCount'),
      }
    }), ['time'], ['asc'])
    .filter(timely => moment(timely.time * 1000).diff(moment(today).subtract(daily_time_range, 'days')) >= 0)

    const __data = _data && _.cloneDeep(_data)

    if (__data) {
      _data = []

      for (let time = moment(today).subtract(daily_time_range, 'days').unix(); time <= today.unix(); time += day_s) {
        _data.push(__data.find(timely => timely.time === time) || { time: time, volume: 0, tx_count: 0 })
      }

      _data = _data.map((timely, i) => {
        return {
          ...timely,
          day_string: i % 2 === 0 && moment(timely.time * 1000).utc().format('DD'),
          volume_percentage_change: _data[i - 1]?.volume > 0 && (timely.volume - _data[i - 1].volume) * 100 / _data[i - 1].volume,
          tx_count_percentage_change: _data[i - 1]?.tx_count > 0 && (timely.tx_count - _data[i - 1].tx_count) * 100 / _data[i - 1].tx_count,
        }
      })

      const _assets = _data.map(timely => timely.assets).filter(assets => assets)

      const assets = {}

      for (let i = 0; i < _assets.length; i++) {
        const __assets = _assets[i]

        for (let j = 0; j < Object.entries(__assets).length; j++) {
          const [key, value] = Object.entries(__assets)[j]

          assets[key] = _.uniqBy(_.concat(assets[key] || [], value || []), 'id')
        }
      }

      dispatch({
        type: TOTAL_DATA,
        value: { assets, time: _.head(_data)?.time, volume: _.sumBy(_data, 'volume'), tx_count: _.sumBy(_data, 'tx_count'), day_string: _.head(_data)?.time && moment(_.head(_data)?.time * 1000).utc().format('MMM D, YYYY [(UTC)]') },
      })
    
      setData(_data)

      if (setTheVolume) {
        setTheVolume(_.last(_data))
      }
    }
  }, [timely_data])

  const loaded = data?.findIndex(timely => timely?.assets && Object.values(timely.assets).flatMap(assets => assets).findIndex(asset => !(asset?.data)) > -1) < 0

  return (
    <div className={`w-full h-56 bg-white dark:bg-gray-900 rounded-lg mt-2 ${loaded ? 'sm:pt-5 pb-0' : 'mb-2 px-7 sm:px-3'}`}>
      {loaded ?
        <ResponsiveContainer>
          <AreaChart
            data={data}
            onMouseEnter={event => {
              if (event && setTheVolume) {
                setTheVolume(event?.activePayload?.[0]?.payload)
              }
            }}
            onMouseMove={event => {
              if (event && setTheVolume) {
                setTheVolume(event?.activePayload?.[0]?.payload)
              }
            }}
            onMouseLeave={() => {
              if (data && setTheVolume) {
                setTheVolume(_.last(data))
              }
            }}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            className="mobile-hidden-x"
          >
            <defs>
              <linearGradient id="gradient-vol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor="#F87171" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#F87171" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day_string" axisLine={false} tickLine={false} />
            <Area type="basis" dataKey="volume" stroke="#B91C1C" fillOpacity={1} fill="url(#gradient-vol)" />
          </AreaChart>
        </ResponsiveContainer>
        :
        <div className="skeleton h-full" />
      }
    </div>
  )
}