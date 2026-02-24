import AnalysisClient from "../../../components/AnalysisClient";

export default async function AnalyzePage({ params }) {
  const { address } = await params;
  return <AnalysisClient address={address} />;
}
