import { createFileRoute } from '@tanstack/react-router'
import { ScreenSwitcher } from '../components/chop-chop/ScreenSwitcher'

export const Route = createFileRoute('/chop-chop-dev')({
  component: ScreenSwitcher,
})
