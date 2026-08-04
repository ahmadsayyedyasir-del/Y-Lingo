interface SocialProofProps {
  rating?: string;
  label?: string;
}

export default function SocialProof({
  rating,
  label = "Trusted by thousands of learners worldwide.",
}: SocialProofProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
      <span className="text-blue-400" aria-hidden="true">
        ★★★★★
      </span>
      {rating && <span className="font-medium text-white">{rating}</span>}
      <span>{label}</span>
    </div>
  );
}