"use client";

import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, TrendingUp, Users, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function TikTokPage() {
  const { activeCompany } = useCompany();

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
          <p className="text-muted-foreground">Please select a company to view TikTok Ads data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TikTok Ads</h1>
          <p className="text-muted-foreground">Monitor your TikTok advertising campaigns and video performance</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/settings">
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Integration
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>

      {/* Connect Integration CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Connect TikTok Ads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Connect your TikTok Ads account to start tracking video campaigns, audience engagement, and performance metrics.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/dashboard/settings">
                Connect TikTok Ads
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://ads.tiktok.com" target="_blank" rel="noopener noreferrer">
                Visit TikTok Ads Manager
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Video className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Advanced Analytics Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're working on detailed video performance analytics, audience demographics, creative insights, and automated optimization features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
