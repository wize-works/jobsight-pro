"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
})

export default function NewDailyLogPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      title: "",
      content: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 font-mono text-white">
          <code className="break-words">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    })

    router.push("/dashboard/daily-logs")
  }

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-3">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Calendar
                      id="date"
                      onSelect={(date) => setDate(date || new Date())}
                      date={date}
                      aria-describedby="date-error"
                    />
                    {form.formState.errors.date && (
                      <p id="date-error" className="text-sm text-red-500">
                        {form.formState.errors.date.message}
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Title of the log" {...field} />
                </FormControl>
                <FormDescription>This is the title of your daily log.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea placeholder="Type your log here." className="resize-none" {...field} />
                </FormControl>
                <FormDescription>Write down what you did today.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  )
}
