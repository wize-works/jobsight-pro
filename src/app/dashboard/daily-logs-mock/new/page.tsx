"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

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
        toast.success({
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Date</span>
                    </label>
                    <input
                        type="date"
                        className="input input-bordered w-full"
                        onChange={(e) => {
                            const newDate = e.target.value ? new Date(e.target.value) : new Date()
                            setDate(newDate)
                            form.setValue("date", newDate, { shouldValidate: true })
                        }}
                        value={date ? date.toISOString().split("T")[0] : ""}
                    />
                    {form.formState.errors.date && (
                        <div className="label">
                            <span className="label-text-alt text-error">{form.formState.errors.date.message}</span>
                        </div>
                    )}
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Title</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Title of the log"
                        className="input input-bordered w-full"
                        {...form.register("title")}
                    />
                    <label className="label">
                        <span className="label-text-alt">This is the title of your daily log.</span>
                    </label>
                    {form.formState.errors.title && (
                        <div className="label">
                            <span className="label-text-alt text-error">{form.formState.errors.title.message}</span>
                        </div>
                    )}
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Content</span>
                    </label>
                    <textarea
                        placeholder="Type your log here."
                        className="textarea textarea-bordered w-full h-32"
                        {...form.register("content")}
                    ></textarea>
                    <label className="label">
                        <span className="label-text-alt">Write down what you did today.</span>
                    </label>
                    {form.formState.errors.content && (
                        <div className="label">
                            <span className="label-text-alt text-error">{form.formState.errors.content.message}</span>
                        </div>
                    )}
                </div>

                <button type="submit" className="btn btn-primary">
                    Submit
                </button>
            </form>
        </div>
    )
}
