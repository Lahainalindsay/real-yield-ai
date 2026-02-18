import React from "react";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return <div className={`card ${className}`} {...rest} />;
}

export function CardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return <div className={`card-pad ${className}`} {...rest} />;
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return <div className={`card-pad ${className}`} {...rest} />;
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  const { className = "", ...rest } = props;
  return <h2 className={`h2 ${className}`} {...rest} />;
}

export function CardSubtitle(props: React.HTMLAttributes<HTMLParagraphElement>) {
  const { className = "", ...rest } = props;
  return <p className={`muted ${className}`} {...rest} />;
}
