import React from "react";
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
} from "react-native-android-widget";

interface SnippetWidgetProps {
  topicTitle: string;
  topicEmoji: string;
  snippet: string;
  imageDataUrl: string | null;
}

export function SnippetWidget({
  topicTitle,
  topicEmoji,
  snippet,
  imageDataUrl,
}: SnippetWidgetProps) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        backgroundColor: "#16161e",
        borderRadius: 20,
        padding: 14,
      }}
      clickAction="OPEN_APP"
    >
      {imageDataUrl ? (
        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            flex: 1,
          }}
        >
          <ImageWidget
            image={imageDataUrl as `data:image${string}`}
            imageWidth={72}
            imageHeight={72}
            radius={12}
            style={{ marginRight: 12 }}
          />
          <FlexWidget
            style={{
              flex: 1,
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
          >
            <TextWidget
              text={`${topicEmoji}  ${topicTitle}`}
              style={{
                fontSize: 11,
                color: "#888888",
                fontWeight: "600",
                marginBottom: 4,
              }}
              maxLines={1}
              truncate="END"
            />
            <TextWidget
              text={snippet}
              style={{
                fontSize: 13,
                color: "#e8e8e8",
                fontWeight: "400",
              }}
              maxLines={4}
              truncate="END"
            />
          </FlexWidget>
        </FlexWidget>
      ) : (
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          <TextWidget
            text={`${topicEmoji}  ${topicTitle}`}
            style={{
              fontSize: 11,
              color: "#888888",
              fontWeight: "600",
              marginBottom: 6,
            }}
            maxLines={1}
            truncate="END"
          />
          <TextWidget
            text={snippet}
            style={{
              fontSize: 14,
              color: "#e8e8e8",
              fontWeight: "400",
            }}
            maxLines={5}
            truncate="END"
          />
        </FlexWidget>
      )}

      <TextWidget
        text="LearnFlow"
        style={{
          fontSize: 10,
          color: "#ffd566",
          fontWeight: "600",
          marginTop: 8,
        }}
        maxLines={1}
      />
    </FlexWidget>
  );
}
