import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const imagePath = "images/placeholders/jewelry/";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const useSceneProgress = (start: number, duration: number) => {
  const frame = useCurrentFrame();

  return interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });
};

const useFade = (start: number, end: number) => {
  const frame = useCurrentFrame();

  return interpolate(frame, [start, start + 24, end - 24, end], [0, 1, 1, 0], {
    ...clamp,
    easing: ease,
  });
};

const Shell = ({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) => {
  const isDark = tone === "dark";

  return (
    <AbsoluteFill
      style={{
        direction: "rtl",
        overflow: "hidden",
        background: isDark
          ? "radial-gradient(circle at 50% 22%, #52422e 0, #1e1b17 36%, #11100e 100%)"
          : "radial-gradient(circle at 50% 16%, #fff8ea 0, #f6efe3 42%, #e7dccb 100%)",
        color: isDark ? "#fff7ea" : "#231d17",
        fontFamily: "VazirFD, sans-serif",
      }}
    >
      <style>
        {`
          @font-face {
            font-family: VazirFD;
            src: url(${staticFile("fonts/Vazir-Regular-FD.woff2")}) format("woff2");
            font-weight: 400;
          }
          @font-face {
            font-family: VazirFD;
            src: url(${staticFile("fonts/Vazir-Medium-FD.woff2")}) format("woff2");
            font-weight: 500;
          }
          @font-face {
            font-family: VazirFD;
            src: url(${staticFile("fonts/Vazir-Bold-FD.woff2")}) format("woff2");
            font-weight: 700;
          }
          @font-face {
            font-family: Doran;
            src: url(${staticFile("fonts/Doran-Bold.woff2")}) format("woff2");
            font-weight: 700;
          }
        `}
      </style>
      <div
        style={{
          position: "absolute",
          inset: 70,
          border: `1px solid ${isDark ? "rgba(255, 240, 210, 0.16)" : "rgba(97, 77, 49, 0.16)"}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          right: -190,
          top: 90,
          background: isDark ? "rgba(204, 164, 93, 0.12)" : "rgba(172, 133, 71, 0.12)",
          filter: "blur(2px)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const ImageCard = ({
  src,
  style,
  imageStyle,
}: {
  src: string;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
}) => (
  <div
    style={{
      position: "absolute",
      overflow: "hidden",
      border: "1px solid rgba(87, 67, 43, 0.18)",
      background: "#f8f0e4",
      boxShadow: "0 34px 90px rgba(45, 34, 20, 0.16)",
      ...style,
    }}
  >
    <Img
      src={staticFile(`${imagePath}${src}`)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...imageStyle,
      }}
    />
  </div>
);

const PersianTitle = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <h1
    style={{
      margin: 0,
      fontFamily: "Doran, VazirFD, sans-serif",
      fontSize: 104,
      lineHeight: 1.1,
      fontWeight: 700,
      letterSpacing: 0,
      ...style,
    }}
  >
    {children}
  </h1>
);

const TextBlock = ({
  eyebrow,
  title,
  body,
  style,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  style?: CSSProperties;
}) => (
  <div style={{ position: "absolute", textAlign: "right", ...style }}>
    {eyebrow ? (
      <div
        style={{
          marginBottom: 28,
          color: "#a78651",
          fontSize: 30,
          fontWeight: 500,
        }}
      >
        {eyebrow}
      </div>
    ) : null}
    <PersianTitle>{title}</PersianTitle>
    {body ? (
      <p
        style={{
          margin: "30px 0 0",
          color: "rgba(48, 39, 29, 0.72)",
          fontSize: 34,
          lineHeight: 1.9,
          fontWeight: 400,
        }}
      >
        {body}
      </p>
    ) : null}
  </div>
);

const IntroScene = () => {
  const progress = useSceneProgress(0, 70);
  const fade = useFade(0, 160);
  const imageY = interpolate(progress, [0, 1], [70, 0]);
  const textY = interpolate(progress, [0, 1], [90, 0]);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Shell>
        <ImageCard
          src="home-hero.webp"
          style={{
            width: 760,
            height: 980,
            left: 120,
            top: 520,
            transform: `translateY(${imageY}px)`,
          }}
          imageStyle={{ transform: "scale(1.04)" }}
        />
        <TextBlock
          eyebrow="Gold Studio"
          title={
            <>
              عکس معمولی
              <br />
              به تصویر فروش
            </>
          }
          body="استودیوی هوش مصنوعی برای طلا و جواهر"
          style={{
            right: 112,
            top: 170,
            width: 850,
            opacity: progress,
            transform: `translateY(${textY}px)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 110,
            bottom: 160,
            color: "rgba(35, 29, 23, 0.58)",
            fontSize: 29,
          }}
        >
          کم‌اصطکاک، موبایل‌محور، فارسی
        </div>
      </Shell>
    </AbsoluteFill>
  );
};

const ProblemScene = () => {
  const progress = useSceneProgress(150, 70);
  const fade = useFade(150, 310);
  const beforeX = interpolate(progress, [0, 1], [120, 0]);
  const afterX = interpolate(progress, [0, 1], [-120, 0]);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Shell>
        <TextBlock
          eyebrow="قبل از انتشار"
          title={
            <>
              نور بد؟
              <br />
              قاب نامطمئن؟
            </>
          }
          body="عکس محصول باید اعتماد بسازد، نه زحمت."
          style={{
            right: 110,
            top: 150,
            width: 850,
            opacity: progress,
            transform: `translateY(${interpolate(progress, [0, 1], [48, 0])}px)`,
          }}
        />
        <ImageCard
          src="upload-preview.webp"
          style={{
            width: 500,
            height: 650,
            right: 105,
            top: 760,
            opacity: interpolate(progress, [0, 1], [0.38, 0.72]),
            transform: `translateX(${beforeX}px) rotate(2deg)`,
          }}
          imageStyle={{ filter: "saturate(0.75) contrast(0.88)" }}
        />
        <ImageCard
          src="style-editorial.webp"
          style={{
            width: 560,
            height: 760,
            left: 105,
            top: 660,
            transform: `translateX(${afterX}px) rotate(-1deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 140,
            top: 1460,
            width: 800,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(167, 134, 81, 0.9), transparent)",
            transform: `scaleX(${progress})`,
          }}
        />
      </Shell>
    </AbsoluteFill>
  );
};

const FlowScene = () => {
  const progress = useSceneProgress(300, 80);
  const fade = useFade(300, 470);
  const steps = ["آپلود", "انتخاب سبک", "خروجی آماده"];

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Shell>
        <TextBlock
          eyebrow="سه قدم کوتاه"
          title={
            <>
              از موبایل
              <br />
              تا استودیو
            </>
          }
          style={{
            right: 110,
            top: 150,
            width: 850,
            opacity: progress,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "610px 96px auto",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          {steps.map((step, index) => {
            const item = interpolate(progress, [index * 0.18, index * 0.18 + 0.55], [0, 1], {
              ...clamp,
              easing: ease,
            });

            return (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 170,
                  padding: "0 44px",
                  border: "1px solid rgba(95, 73, 45, 0.16)",
                  background: "rgba(255, 251, 243, 0.78)",
                  opacity: item,
                  transform: `translateY(${interpolate(item, [0, 1], [44, 0])}px)`,
                }}
              >
                <span style={{ color: "#a78651", fontSize: 34 }}>۰{index + 1}</span>
                <span style={{ fontSize: 48, fontWeight: 500 }}>{step}</span>
              </div>
            );
          })}
        </div>
        <ImageCard
          src="style-gold.webp"
          style={{
            width: 360,
            height: 460,
            left: 138,
            bottom: 126,
            opacity: progress,
            transform: `translateY(${interpolate(progress, [0, 1], [80, 0])}px)`,
          }}
        />
      </Shell>
    </AbsoluteFill>
  );
};

const ResultScene = () => {
  const progress = useSceneProgress(455, 85);
  const fade = useFade(455, 600);
  const scale = interpolate(progress, [0, 1], [1.12, 1]);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Shell tone="dark">
        <ImageCard
          src="result-hero-dark.webp"
          style={{
            width: 870,
            height: 1050,
            right: 105,
            top: 210,
            borderColor: "rgba(255, 233, 190, 0.2)",
            boxShadow: "0 44px 120px rgba(0, 0, 0, 0.45)",
          }}
          imageStyle={{ transform: `scale(${scale})` }}
        />
        <div
          style={{
            position: "absolute",
            right: 96,
            left: 96,
            bottom: 154,
            textAlign: "right",
            opacity: progress,
            transform: `translateY(${interpolate(progress, [0, 1], [62, 0])}px)`,
          }}
        >
          <div style={{ color: "#d1ad6d", fontSize: 31, marginBottom: 26 }}>
            برای فروشنده‌های طلا و محصول
          </div>
          <PersianTitle style={{ color: "#fff7ea", fontSize: 96 }}>
            هر محصول،
            <br />
            یک تصویر شایسته‌تر
          </PersianTitle>
          <div
            style={{
              marginTop: 42,
              display: "inline-flex",
              border: "1px solid rgba(255, 237, 202, 0.24)",
              padding: "26px 34px",
              color: "rgba(255, 247, 234, 0.78)",
              fontSize: 30,
            }}
          >
            gold studio · شروع تولید تصویر
          </div>
        </div>
      </Shell>
    </AbsoluteFill>
  );
};

export const GoldStudioLaunch = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const vignette = interpolate(frame, [0, durationInFrames - 1], [0.14, 0.28]);

  return (
    <AbsoluteFill style={{ background: "#16120d" }}>
      <IntroScene />
      <ProblemScene />
      <FlowScene />
      <ResultScene />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: `radial-gradient(circle at 50% 45%, transparent 36%, rgba(23, 16, 10, ${vignette}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
