import React from "react";
import type { WidgetTaskHandler } from "react-native-android-widget";
import { getWidgetData, advanceWidgetSnippet } from "@/services/widgetData";
import { SnippetWidget } from "./SnippetWidget";

const PLACEHOLDER_SNIPPET =
  "Open LearnFlow to set up your personalized learning flow.";

export const widgetTaskHandler: WidgetTaskHandler = async (props) => {
  const { widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case "WIDGET_ADDED": {
      const data = await getWidgetData();
      if (!data || data.snippets.length === 0) {
        renderWidget(
          React.createElement(SnippetWidget, {
            topicTitle: "LearnFlow",
            topicEmoji: "📚",
            snippet: PLACEHOLDER_SNIPPET,
            imageDataUrl: null,
          }),
        );
        return;
      }
      renderWidget(
        React.createElement(SnippetWidget, {
          topicTitle: data.topicTitle,
          topicEmoji: data.topicEmoji,
          snippet: data.snippets[data.currentIndex] ?? PLACEHOLDER_SNIPPET,
          imageDataUrl: data.imageDataUrl,
        }),
      );
      break;
    }

    case "WIDGET_UPDATE": {
      const data = await advanceWidgetSnippet();
      if (!data || data.snippets.length === 0) {
        renderWidget(
          React.createElement(SnippetWidget, {
            topicTitle: "LearnFlow",
            topicEmoji: "📚",
            snippet: PLACEHOLDER_SNIPPET,
            imageDataUrl: null,
          }),
        );
        return;
      }
      renderWidget(
        React.createElement(SnippetWidget, {
          topicTitle: data.topicTitle,
          topicEmoji: data.topicEmoji,
          snippet: data.snippets[data.currentIndex] ?? PLACEHOLDER_SNIPPET,
          imageDataUrl: data.imageDataUrl,
        }),
      );
      break;
    }

    case "WIDGET_RESIZED":
    case "WIDGET_CLICK":
    case "WIDGET_DELETED":
    default:
      break;
  }
};
