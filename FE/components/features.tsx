import { useState } from 'react'
import {
  Box,
  Text,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { ethers } from 'ethers'
import abi from '../data/abi.json'

import { useProvider, useSigner } from 'wagmi'

export const DepositModal = () => {
  const { data: signer } = useSigner()
  const provider = useProvider()
  let apWineryContract = {}

  const [unrealizedYield, setUnrealizedYield] = useState('')
  const [hasDeposited, setHasDeposited] = useState(false)

  try {
      if (provider) {
        apWineryContract = new ethers.Contract("0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1", abi.abi, signer)

        if (apWineryContract && apWineryContract.getUnrealizedYield ) {
          const unrealizedYieldBigNumber = apWineryContract.getUnrealizedYield()
          unrealizedYieldBigNumber.then(returnedYield => {
            setUnrealizedYield(ethers.utils.formatEther(returnedYield))
          })
        }
    }
  } catch(e) {
    console.log(e)
  }

  const [sliderValue, setSliderValue] = useState(1)

  const onDeposit= async () => {
    const ethToSend = sliderValue * 0.1
    await apWineryContract.deposit({ value: ethers.utils.parseEther(ethToSend.toString()) });
    setTimeout(() => {setHasDeposited(true)},2000)
  }

  const onWithdraw= async () => {
    await apWineryContract.withdraw();
    setTimeout(() => {setHasDeposited(false)},2000)
  }

  return (
    <>
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={4}>
        <Box pt={6} pb={6} pr={6} pl={6} display="flex" justifyContent="center" alignItems="center" gap={4} flexDirection="column" w='sm' backgroundColor="#7E40B6" borderRadius="lg">
          <Text fontSize="xl" color="white" fontWeight="bold">
            Unrealized Yield: 0.006 ETH
          </Text>
          { !hasDeposited &&
          <div>
            <Slider aria-label='slider-ex-6' defaultValue={1} min={1} max={100} step={1} onChange={(val) => setSliderValue(val)}>
              <SliderTrack bg='red.100'>
                <Box position='relative' right={10} />
                <SliderFilledTrack bg='tomato' />
              </SliderTrack>
              <SliderThumb boxSize={6} />
            </Slider>
            <Button onClick={() => onDeposit()}>Get {sliderValue} Ticket{sliderValue > 1 ? 's' : ''}</Button>
          </div>
          }
          { hasDeposited &&
            <Text fontSize="xl" color="white" fontWeight="bold">
              You have deposited {sliderValue} ticket{sliderValue > 1 ? 's' : ''}!
            </Text>
          }
        </Box>
        <Box w='lg' display="flex" justifyContent="center" >
        <Button onClick={()=> onWithdraw()}>Withdraw</Button>
        </Box>
      </Box>
    </>
  )
}
