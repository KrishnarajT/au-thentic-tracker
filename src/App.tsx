import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import AuthWrapper from "@/components/Auth/AuthWrapper";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<AuthProvider>
			<TooltipProvider>
				<Toaster />
				<Sonner />
				<AuthWrapper>
					<BrowserRouter>
						<Routes>
							<Routes>
								<Route path="/callback" element={<OidcCallback />} />
								<Route
									path="/"
									element={
										<ProtectedRoute>
											<Index />
										</ProtectedRoute>
									}
								/>
							</Routes>
							{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
							<Route path="*" element={<NotFound />} />
						</Routes>
					</BrowserRouter>
				</AuthWrapper>
			</TooltipProvider>
		</AuthProvider>
	</QueryClientProvider>
);

export default App;
