import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, type FeedbackFormData } from '@/types/feedback';
import { MessageSquarePlus, Send } from 'lucide-react';

const feedbackFormSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Please select a priority level'
  })
});

export function FeedbackForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: '',
      subject: '',
      description: '',
      priority: 'medium'
    }
  });

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user) {
      toast({
        title: t('feedback.authRequired'),
        description: t('feedback.authRequiredDesc'),
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          category: data.category,
          subject: data.subject,
          description: data.description,
          priority: data.priority
        });

      if (error) throw error;

      toast({
        title: t('feedback.successTitle'),
        description: t('feedback.successDesc')
      });

      form.reset();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: t('feedback.errorTitle'),
        description: t('feedback.errorDesc'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <MessageSquarePlus className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">{t('feedback.submitFeedback')}</CardTitle>
        <CardDescription>
          {t('feedback.submitFeedbackDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('feedback.category')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('feedback.selectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FEEDBACK_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
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
                    <FormLabel>{t('feedback.priorityLevel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('feedback.selectPriority')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FEEDBACK_PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={priority.color}>
                                {priority.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.subject')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('feedback.subjectPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('feedback.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('feedback.descriptionPlaceholder')}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                t('feedback.submitting')
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('feedback.submitFeedback')}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}