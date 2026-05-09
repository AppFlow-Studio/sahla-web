import PlaceholderPage from "../../_components/PlaceholderPage";

export default function PrayerTimesPage() {
  return (
    <PlaceholderPage
      section="Mosque Setup"
      title="Prayer Times"
      description="Pick your calculation method and configure iqamah — fixed times, offsets from athan, or seasonal rules."
      bullets={[
        "Calculation method picker (MWL, ISNA, Egyptian, Karachi, etc.)",
        "Iqamah grid: 5 prayers × 3 modes (Fixed / Offset / Seasonal)",
        "Live preview of today's times",
      ]}
    />
  );
}
