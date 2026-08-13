'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { hrProfileAPI } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function HRProfilePage() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    hrProfileAPI.get().then((r: any) => reset({ ...r.hr_profile, full_name: r.user?.full_name })).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await hrProfileAPI.update({ ...data, hiring_interests: typeof data.hiring_interests === 'string' ? data.hiring_interests.split(',').map((s: string) => s.trim()) : data.hiring_interests || [] });
      toast.success('HR profile updated');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <DashboardLayout requiredRole="hr">
      <div className="animate-fade-in max-w-xl">
        <h1 className="font-display text-3xl text-ink-900 mb-1">My HR Profile</h1>
        <p className="text-ink-500 text-sm mb-8">Company and recruiter information</p>
        {loading ? <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div> : (
          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
            <div><label className="label">Company Name</label><input {...register('company_name')} className="input" placeholder="Your company" /></div>
            <div><label className="label">Designation</label><input {...register('designation')} className="input" placeholder="Senior Recruiter" /></div>
            <div><label className="label">Company Website</label><input {...register('company_website')} className="input" placeholder="https://company.com" /></div>
            <div><label className="label">LinkedIn</label><input {...register('linkedin_url')} className="input" placeholder="https://linkedin.com/in/..." /></div>
            <div><label className="label">Hiring Interests (comma separated)</label><input {...register('hiring_interests')} className="input" placeholder="Full Stack Developer, Data Scientist" /></div>
            <button type="submit" className="btn-primary">Save Profile</button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
