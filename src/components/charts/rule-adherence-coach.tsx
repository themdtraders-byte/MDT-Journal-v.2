
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Award, TrendingUp, TrendingDown } from 'lucide-react';

interface RuleAdherenceCoachProps {
  adherenceData: { name: string; value: number }[];
}

const RuleAdherenceCoach = ({ adherenceData }: RuleAdherenceCoachProps) => {
  const analysis = useMemo(() => {
    if (!adherenceData || adherenceData.length === 0) {
      return {
        diagnosis: "Awaiting Adherence Data",
        reason: "The coach needs data from the adherence chart to provide insights.",
        action: "Ensure your trading plan is set up and you have logged trades to analyze."
      };
    }

    const lowestAdherence = [...adherenceData].sort((a, b) => a.value - b.value)[0];

    if (lowestAdherence.value < 60) {
      return {
        diagnosis: `Your biggest leak is ${lowestAdherence.name} Adherence.`,
        reason: `With a compliance rate of only ${lowestAdherence.value.toFixed(1)}%, this is the area where you are breaking your rules most often. This inconsistency is likely a major source of your losses.`,
        action: `Focus all your attention on improving your ${lowestAdherence.name} rule. Before your next trade, write this rule down and place it where you can see it.`
      };
    }

    const highestAdherence = [...adherenceData].sort((a, b) => b.value - a.value)[0];

    if (highestAdherence.value > 95) {
      return {
        diagnosis: `You have mastered ${highestAdherence.name} Adherence.`,
        reason: `Your compliance rate of ${highestAdherence.value.toFixed(1)}% shows that following this rule has become second nature to you.`,
        action: "Excellent work. Now, apply this same level of discipline to your next weakest area to turn it into a strength."
      };
    }

    return {
      diagnosis: "Your discipline is solid.",
      reason: "Your adherence rates are all within a healthy range, showing a good balance of discipline across your core trading rules.",
      action: "Continue to maintain this consistency. Small improvements in all areas will lead to significant long-term growth."
    };

  }, [adherenceData]);

  return (
    <Card className="glassmorphic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-primary" />
          Adherence Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-base flex items-center gap-2"><Award className="text-yellow-500" /> Diagnosis</h4>
          <p className="text-sm text-muted-foreground italic">"{analysis.diagnosis}"</p>
        </div>
        <div>
          <h4 className="font-semibold text-base flex items-center gap-2"><TrendingUp className="text-green-500" /> Reason</h4>
          <p className="text-sm text-muted-foreground">{analysis.reason}</p>
        </div>
        <div>
          <h4 className="font-semibold text-base flex items-center gap-2"><TrendingDown className="text-red-500" /> Actionable Step</h4>
          <p className="text-sm text-muted-foreground">{analysis.action}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RuleAdherenceCoach;
