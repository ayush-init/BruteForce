"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TopicCard } from '@/components/student/topics/TopicCard';
import { ArrowRight, BookOpen } from 'lucide-react';
import { TopicsSectionShimmer } from '@/components/student/home/TopicsSectionShimmer';
import { Topic } from '@/types/student/index.types';

interface TopicsSectionProps {
  topics: Topic[];
  loading?: boolean;
}

export function TopicsSection({ topics, loading = false }: TopicsSectionProps) {
  const displayTopics = topics.slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-10 ">
      {/* Section with subtle gradient background */}
      <div className=" glass backdrop-blur-sm rounded-2xl border border-border/40 p-8 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-[18px] sm:text-2xl font-bold text-foreground mb-1.5 font-serif ">
              Learning <span className='text-primary'>Path</span>
            </h2>
            <p className="text-[13px] text-muted-foreground">Jump back into your assigned topics</p>
          </div>
          <Button
            asChild
            size="sm"
            className="hidden sm:inline-flex rounded-2xl bg-logo/10! px-4 font-bold! text-logo!"
          >
            <Link href="/topics">
              View all
              <ArrowRight className="w-4 h-4" strokeWidth={3}/>
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <TopicsSectionShimmer />
      ) : displayTopics.length > 0 ? (
        <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayTopics.map((topic: Topic, idx) => (
            <div key={topic.slug} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
              <TopicCard
                topicSlug={topic.slug}
                topicName={topic.topic_name}
                photoUrl={topic.photo_url}
                totalQuestions={topic.batchSpecificData?.totalQuestions || 0}
                solvedQuestions={topic.batchSpecificData?.solvedQuestions || 0}
                totalClasses={topic.batchSpecificData?.totalClasses || 0}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass hover-glow border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2 font-serif ">No topics assigned yet</h3>
          <p className="text-[14px] text-muted-foreground max-w-sm mb-6">
            When you join a batch and topics are assigned, they will appear right here.
          </p>
          <Button asChild variant="outline">
            <Link href="/practice">Go to Practice Area</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 text-center sm:hidden">
        <Button asChild variant="ghost" className="w-full text-primary">
          <Link href="/topics">
            View all topics
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
