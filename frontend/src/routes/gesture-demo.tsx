import { createFileRoute } from '@tanstack/react-router'
import { CursorPathTracker } from '../components/CursorPathTracker'
import type { CursorPoint } from '../components/CursorPathTracker'
import { useState } from 'react'
import { MasterRecipe } from '#/components/MasterRecipe'

import recipes from '../data/recipes.json'

export const Route = createFileRoute('/gesture-demo')({ component: GestureDemo })

function GestureDemo() {
  const [currentPoints, setCurrentPoints] = useState<CursorPoint[]>([])

  // useEffect(()=>{
  //   if(currentPoints.length == 0)
  //     setSuccess(false)
  // },[currentPoints])

  return (
    <div className="relative">
      <CursorPathTracker onPointsChange={setCurrentPoints} />
      <MasterRecipe recipe={recipes[0]} points={currentPoints} />
    </div>
  )
}
