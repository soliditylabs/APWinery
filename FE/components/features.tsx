import { useState, useEffect } from 'react'
import {
  Box,
  Text,
  useDisclosure,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { ethers } from 'ethers'
import abi from '../data/abi.json'

import { useAccount, useProvider, useSigner } from 'wagmi'

export const DepositModal = () => {

const {address, connector, isConnected } = useAccount()
const { data: signer, isError, isLoading } = useSigner()
const provider = useProvider()

let erc20rw = {}

const [unrealizedYield, setUnrealizedYield] = useState('')
const [showFinalTickets, setShowFinalTickets] = useState(false)

  try {
      if (provider) {
erc20rw = new ethers.Contract('0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1', abi.abi, signer)

console.log({erc20rw})

    if (erc20rw && erc20rw.getUnrealizedYield ) {
      const unrealizedYieldBigNumber = erc20rw.getUnrealizedYield()
      unrealizedYieldBigNumber.then(val => {
        setUnrealizedYield(ethers.utils.formatEther(val))
        console.log({unrealizedYield})
      })
    }
  }
  } catch(e) {
    console.log(e)
  }

  const [sliderValue, setSliderValue] = useState(1)

  const labelStyles = {
    mt: '2',
    ml: '-2.5',
    fontSize: 'sm',
  }

  const onDeposit= async () => {
    const ethToSend = sliderValue * 0.1
    await erc20rw.deposit({ value: ethers.utils.parseEther(ethToSend.toString()) });
  }

  const onWithdraw= async () => {
    await erc20rw.withdraw();
  }

  const { isOpen, onOpen, onClose } = useDisclosure()
    return (
      <>
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={4}>
<Box pt={6} pb={6} pr={6} pl={6} display="flex" justifyContent="center" alignItems="center" gap={4} flexDirection="column" w='sm' backgroundColor="#7E40B6" borderRadius="lg">
  <Text fontSize="xl" color="white" fontWeight="bold">Unrealized Yield: 0.006 ETH</Text>
      <Slider aria-label='slider-ex-6' defaultValue={1} min={1} max={100} step={1} onChange={(val) => setSliderValue(val)}>
  <SliderTrack bg='red.100'>
    <Box position='relative' right={10} />
    <SliderFilledTrack bg='tomato' />
  </SliderTrack>
  <SliderThumb boxSize={6} />
</Slider>
     <Button onClick={() => onDeposit()}>Get {sliderValue} Ticket{sliderValue > 1 ? 's' : ''}</Button>
    </Box>
    <Box w='lg' display="flex" justifyContent="center" >
     <Button onClick={()=> onWithdraw()}>Withdraw</Button>
    </Box>
      </Box>
      </>
    )
  }
