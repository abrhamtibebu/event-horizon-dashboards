// Utility function to get color coding for tasks based on task type
import { TASK_COLORS } from '../constants'

export function getTaskColor(task: string): string {
  const taskLower = task.toLowerCase().trim()

  // Check-in related tasks
  if (taskLower.includes('check-in') || taskLower.includes('checkin') || taskLower.includes('registration')) {
    return TASK_COLORS['check-in']
  }

  // Security related tasks
  if (taskLower.includes('security') || taskLower.includes('guard') || taskLower.includes('safety')) {
    return TASK_COLORS['security']
  }

  // Guest assistance tasks
  if (taskLower.includes('guest') || taskLower.includes('assistance') || taskLower.includes('help') || taskLower.includes('support')) {
    return TASK_COLORS['guest-assistance']
  }

  // Crowd control tasks
  if (taskLower.includes('crowd') || taskLower.includes('control') || taskLower.includes('manage')) {
    return TASK_COLORS['crowd-control']
  }

  // Communication tasks
  if (taskLower.includes('communication') || taskLower.includes('announcement') || taskLower.includes('coordination')) {
    return TASK_COLORS['communication']
  }

  // Technical tasks
  if (taskLower.includes('technical') || taskLower.includes('equipment') || taskLower.includes('setup') || taskLower.includes('audio') || taskLower.includes('video')) {
    return TASK_COLORS['technical']
  }

  // Emergency tasks
  if (taskLower.includes('emergency') || taskLower.includes('first aid') || taskLower.includes('medical')) {
    return TASK_COLORS['emergency']
  }

  // Default color for other tasks
  return TASK_COLORS['default']
}
