import { SampleChart } from "@/components/SampleChart";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-xl text-muted-foreground">Your data visualization</p>
        </div>
        <SampleChart />
      </div>
    </div>
  );
};

export default Index;
