import { SkyBackdrop } from "@/components/story/SkyBackdrop";
import { StoryChrome } from "@/components/story/StoryChrome";
import { StoryStage } from "@/components/story/stage/StoryStage";
import { getHomeData } from "@/lib/data";

// Konten berubah lewat CMS (revalidatePath), selebihnya disegarkan tiap jam.
export const revalidate = 3600;

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
