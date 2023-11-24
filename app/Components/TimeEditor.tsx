import { Timeline, TimelineState } from "@xzdarcy/react-timeline-editor";
import { cloneDeep } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import "./index.css";
import { mockData, mockEffect } from "../mock";

const defaultEditorData = cloneDeep(mockData);

console.log(defaultEditorData);

const TimelineEditor = () => {
  const [data, setData] = useState(defaultEditorData);
  const [time, setTime] = useState(0);

  let a = 0;
  let videoDuration = 800;

  const domRef = useRef<HTMLDivElement>();
  const timelineState = useRef<TimelineState>();

  console.log(data[1]);

  const CustomScale = (props: { scale: number }) => {
    const { scale } = props;

    console.log(scale);
    // const totalSeconds = videoDuration * scale;

    const min = parseInt(scale / 60 + "");
    const second = ((scale % 60) + "").padStart(2, "0");
    console.log(min, second);
    return (
      <>
        {min}:{second}
      </>
    );
  };

  // const CustomScale = (props: { scale: number }) => {
  //   const { scale } = props;
  //   const totalSeconds = videoDuration * scale;
  //   const min = parseInt(totalSeconds / 60 + "");
  //   const second = ((totalSeconds % 60) + "").padStart(2, "0");
  //   return (
  //     <>
  //       {min}:{second}
  //     </>
  //   );
  // }

  console.log(data);

  return (
    <div className="timeline-editor-example7">
      <div
        ref={domRef as any}
        style={{ overflow: "overlay" }}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          if (timelineState.current)
            timelineState.current.setScrollTop(target.scrollTop);
        }}
        className={"timeline-list"}
      >
        {data.map((item) => {
          return (
            <div className="timeline-list-item" key={item.id}>
              <div className="text">{`row${item.id}`}</div>
            </div>
          );
        })}
      </div>
      <Timeline
        ref={timelineState as any}
        onChange={setData}
        editorData={data}
        effects={mockEffect}
        onScroll={({ scrollTop }) => {
          if (domRef.current) domRef.current.scrollTop = scrollTop;
        }}
        scale={30}
        scaleSplitCount={10}
      />
    </div>
  );
};

export default TimelineEditor;
