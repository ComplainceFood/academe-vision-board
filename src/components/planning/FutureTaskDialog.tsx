
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { FutureTask, FutureTaskFormData } from "@/services/planningService";

export interface FutureTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FutureTaskFormData) => void;
  task?: FutureTask;
  title?: string;
  semester?: string;
}

export function FutureTaskDialog({
  open,
  onOpenChange,
  onSave,
  task,
  title = "Add Future Task",
  semester = "Fall 2025"
}: FutureTaskDialogProps) {
  const form = useForm<FutureTaskFormData>({
    defaultValues: {
      title: "",
      semester: semester,
      priority: "medium",
      estimated_hours: 0
    }
  });

  // When editing an existing task, populate the form
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        semester: task.semester,
        priority: task.priority,
        estimated_hours: task.estimated_hours || 0
      });
    } else {
      form.reset({
        title: "",
        semester: semester,
        priority: "medium",
        estimated_hours: 0
      });
    }
  }, [task, semester, form]);

  const handleSubmit = (data: FutureTaskFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details of your future task." : "Add a new task to your future planning."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                        <SelectItem value="Spring 2026">Spring 2026</SelectItem>
                        <SelectItem value="Fall 2026">Fall 2026</SelectItem>
                        <SelectItem value="Spring 2027">Spring 2027</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimated_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Estimated hours to complete"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      min={0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <DialogFooter>
              <Button type="submit">{task ? "Update Task" : "Add Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
