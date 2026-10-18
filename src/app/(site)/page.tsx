import { SkyBackdrop } from "@/components/story/SkyBackdrop";
import { StoryChrome } from "@/components/story/StoryChrome";
import { StoryStage } from "@/components/story/stage/StoryStage";
import { getHomeData } from "@/lib/data";

// Dirender saat request (bukan saat build) supaya build tidak bergantung pada koneksi database.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <SkyBackdrop />
      <StoryChrome
        name={data.profile?.nickname ?? "Hilal"}
        banner={
          data.profile?.bannerOn && data.profile.bannerText
            ? { text: data.profile.bannerText, cta: data.profile.bannerCta, url: data.profile.bannerUrl }
            : null
        }
      />
      <main>
        <StoryStage data={data} />
      </main>
    </>
  );
}
