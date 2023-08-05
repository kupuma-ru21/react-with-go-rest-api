import axios from 'axios'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Task } from '../types'
import useStore from '../store'
import { useError } from '../hooks/useError'

export const useMutateTask = () => {
  const queryClient = useQueryClient()
  const { switchErrorHandling } = useError()
  const resetEditedTask = useStore((state) => state.resetEditedTask)

  const createTaskMutation = useMutation(
    (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) =>
      axios.post<Task>(`${process.env.REACT_APP_API_URL}/tasks`, task),
    {
      onSuccess: (res) => {
        const tasksCached = queryClient.getQueryData<Task[]>(['tasks'])
        if (tasksCached) {
          queryClient.setQueryData(['tasks'], [...tasksCached, res.data])
        }
        resetEditedTask()
      },
      onError: (err: any) => {
        if (err.response.data.message) {
          switchErrorHandling(err.response.data.message)
          return
        }
        switchErrorHandling(err.response.data)
      },
    }
  )

  const updateTaskMutation = useMutation(
    (task: Omit<Task, 'created_at' | 'updated_at'>) =>
      axios.put<Task>(`${process.env.REACT_APP_API_URL}/tasks/${task.id}`, {
        title: task.title,
      }),
    {
      onSuccess: (res, variables) => {
        const tasksCached = queryClient.getQueryData<Task[]>(['tasks'])
        if (tasksCached) {
          queryClient.setQueryData<Task[]>(
            ['tasks'],
            tasksCached.map((task) =>
              task.id === variables.id ? res.data : task
            )
          )
        }
        resetEditedTask()
      },
      onError: (err: any) => {
        if (err.response.data.message) {
          switchErrorHandling(err.response.data.message)
          return
        }
        switchErrorHandling(err.response.data)
      },
    }
  )
  const deleteTaskMutation = useMutation(
    (id: number) =>
      axios.delete(`${process.env.REACT_APP_API_URL}/tasks/${id}`),
    {
      onSuccess: (_, variables) => {
        const tasksCached = queryClient.getQueryData<Task[]>(['tasks'])
        if (tasksCached) {
          queryClient.setQueryData<Task[]>(
            ['tasks'],
            tasksCached.filter((task) => task.id !== variables)
          )
        }
        resetEditedTask()
      },
      onError: (err: any) => {
        if (err.response.data.message) {
          switchErrorHandling(err.response.data.message)
          return
        }
        switchErrorHandling(err.response.data)
      },
    }
  )

  return { createTaskMutation, updateTaskMutation, deleteTaskMutation }
}
