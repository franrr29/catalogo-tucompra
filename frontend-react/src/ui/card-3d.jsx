// ui/card-3d.jsx
"use client";
import { createContext, useContext, useState, useRef, useEffect } from "react";

const MouseEnterContext = createContext(undefined);

export const CardContainer = ({ children, className, containerClassName }) => {
  const containerRef = useRef(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  };

  const handleMouseEnter = () => setIsMouseEntered(true);
  
  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    }
  };

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div className={containerClassName} style={{ perspective: "1000px" }}>
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={className}
          style={{ transformStyle: "preserve-3d", transition: "all 0.1s ease-linear" }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({ children, className }) => {
  return <div className={className} style={{ transformStyle: "preserve-3d" }}>{children}</div>;
};

export const CardItem = ({ as: Tag = "div", children, className, translateZ = 0, ...rest }) => {
  const [isMouseEntered] = useContext(MouseEnterContext);
  return (
    <Tag
      className={className}
      style={{
        transform: isMouseEntered ? `translateZ(${translateZ}px)` : "translateZ(0px)",
        transition: "transform 0.3s ease-out",
        transformStyle: "preserve-3d"
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
};