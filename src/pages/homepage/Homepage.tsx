// src/pages/homepage/Homepage.tsx
import Navbar from "@/components/shared/Navbar";

export default function Homepage() {
    return (
        <div className="">
            <Navbar />

            {/* Main content (currently commented out) */}
            {/*
            <main className="container mx-auto px-4 py-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">Welcome to MyShop</h1>
                    <p className="text-xl text-muted-foreground">
                        Your one-stop destination for all your shopping needs
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-6 border rounded-lg">
                                <div className="h-48 bg-muted rounded-md mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    Product {i + 1}
                                </h3>
                                <p className="text-muted-foreground">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <HeroSection />
            <CategoriesCarousel />
            <DealOfTheDay />
            <ProductsSection />
            <div className="container mx-auto px-4 py-16">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold">More Content Below</h2>
                    <p className="text-muted-foreground">
                        This section is visible below the 70vh hero section
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-6 border rounded-lg">
                                <div className="h-48 bg-muted rounded-md mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    Product {i + 1}
                                </h3>
                                <p className="text-muted-foreground">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            */}
        </div>
    );
}
