import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield } from "lucide-react";
import StaffListTab from "@/components/staff/StaffListTab";
import PermissionsTab from "@/components/staff/PermissionsTab";

const StaffPage = () => {
  const [activeTab, setActiveTab] = useState("staff");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Personel Yönetimi</h1>
          <p className="text-muted-foreground text-sm mt-1">Personel, roller ve yetki atamalarını yönetin</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="staff" className="gap-2">
              <Users className="h-4 w-4" />
              Personel Listesi
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-4 w-4" />
              Yetkiler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-4">
            <StaffListTab />
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <PermissionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StaffPage;
