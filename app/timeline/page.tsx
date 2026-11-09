import ShopNav from "../components/ShopNav";

// The Timeline tab (project2-a). Empty for now apart from the shared buttons.
// (The intro videos play in Deadline Dash, on the way here.)
export default function TimelinePage() {
  return (
    <div className="stage">
      <img src="/project2-a.png" alt="Brawl Stars style shop screen, Timeline tab" />

      <ShopNav current="timeline" backTo={null} />
    </div>
  );
}
