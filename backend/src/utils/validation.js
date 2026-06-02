const { z } = require('zod');

// MCQ Generation Schema
const MCQGenerationSchema = z.object({
  topic: z.string().min(2).max(100),
  count: z.number().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  group_id: z.string().uuid().optional(),
  assignment_id: z.string().uuid().optional(),
});

// Assignment Creation Schema
const AssignmentSchema = z.object({
  group_id: z.string().uuid(),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

// Profile Update Schema
const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  headline: z.string().max(255).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(255).optional(),
});

module.exports = {
  MCQGenerationSchema,
  AssignmentSchema,
  ProfileUpdateSchema,
};
