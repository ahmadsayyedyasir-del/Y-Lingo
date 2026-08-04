interface SectionTitleProps {
  title: string;
  subtitle: string;
}

export default function SectionTitle({
  title,
  subtitle,
}: SectionTitleProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-4xl font-bold text-white">{title}</h2>

      <p className="mt-6 text-lg leading-8 text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}