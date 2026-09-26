import { createFileRoute } from '@tanstack/react-router'
import { CursorPathTracker, type CursorPoint } from '../components/CursorPathTracker'
import { useEffect, useState } from 'react'
import { LineTarget } from '#/components/LineTarget'
import { GestureRecipe } from '#/components/GestureRecipe'

import recipes from "../data/recipes.json"

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [currentPoints, setCurrentPoints] = useState<CursorPoint[]>([])

  // useEffect(()=>{
  //   if(currentPoints.length == 0)
  //     setSuccess(false)
  // },[currentPoints])

  return (<div className='relative'>
      <CursorPathTracker onPointsChange={setCurrentPoints} />
      {/* <LineTarget points={currentPoints} origin={{ x: 100, y: 100 }} end={{ x: 200, y: 200 }} radius={30} onMatchChange={(m)=>console.log(m)} allowStartOutsideTarget={true} /> */}
      <GestureRecipe
        recipe={recipes[0]}
        points={currentPoints}
      />
    </div>)
}
