import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export interface SuggestionItem {
  id: string;
  personName: string;
  prompt: string;
  rationale: string;
  sentimentLabel: string;
}

export interface TopSuggestionsCardProps {
  suggestions: SuggestionItem[];
  caption?: string;
  onSelectSuggestion?: (suggestion: SuggestionItem) => void;
}

export const TopSuggestionsCard: React.FC<TopSuggestionsCardProps> = ({
  suggestions,
  caption = "This week's recommended touches",
  onSelectSuggestion,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Top 5 Suggestions</CardTitle>
        <CardDescription>{caption}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} className="rounded-md border border-border">
              <button
                type="button"
                onClick={() => onSelectSuggestion?.(suggestion)}
                className="flex w-full flex-col items-start gap-1 rounded-md px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`${index + 1}. ${suggestion.personName}: ${suggestion.prompt}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {index + 1}. {suggestion.personName}
                </span>
                <span className="text-sm text-foreground">{suggestion.prompt}</span>
                <span className="text-xs text-muted-foreground">{suggestion.rationale}</span>
                <span className="sr-only">Sentiment: {suggestion.sentimentLabel}</span>
              </button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};
