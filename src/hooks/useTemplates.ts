import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export interface Template {
  id: string;
  name: string;
  type: "note" | "meeting" | "achievement";
  category?: string;
  data: Record<string, any>;
  createdAt: string;
}

const TEMPLATES_STORAGE_KEY = "smartprof_templates";

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load templates from localStorage on mount
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`${TEMPLATES_STORAGE_KEY}_${user.id}`);
      if (stored) {
        try {
          setTemplates(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse templates:", e);
          setTemplates([]);
        }
      }
    }
  }, [user]);

  // Save templates to localStorage whenever they change
  const saveTemplates = (newTemplates: Template[]) => {
    if (user) {
      localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${user.id}`, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    }
  };

  const addTemplate = (template: Omit<Template, "id" | "createdAt">) => {
    const newTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveTemplates([...templates, newTemplate]);
    return newTemplate;
  };

  const deleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  };

  const getTemplatesByType = (type: Template["type"]) => {
    return templates.filter(t => t.type === type);
  };

  const applyTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId)?.data;
  };

  return {
    templates,
    addTemplate,
    deleteTemplate,
    getTemplatesByType,
    applyTemplate,
  };
}
