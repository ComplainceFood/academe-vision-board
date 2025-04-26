
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Plus, 
  Filter, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle,
  ArrowUpDown,
  FileText,
  PackageOpen,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  currentCount: number;
  totalCount: number;
  threshold: number;
  course: string;
  lastRestocked?: string;
  cost?: number;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  course: string;
  receipt?: boolean;
}

const mockSupplies: SupplyItem[] = [
  {
    id: "1",
    name: "Whiteboard Markers",
    category: "Office",
    currentCount: 8,
    totalCount: 20,
    threshold: 5,
    course: "All",
    lastRestocked: "2025-04-10",
    cost: 1.75
  },
  {
    id: "2",
    name: "Lab Notebooks",
    category: "Lab",
    currentCount: 4,
    totalCount: 30,
    threshold: 10,
    course: "CS202",
    lastRestocked: "2025-04-05",
    cost: 3.50
  },
  {
    id: "3",
    name: "Raspberry Pi Kits",
    category: "Electronics",
    currentCount: 3,
    totalCount: 15,
    threshold: 5,
    course: "CS404",
    lastRestocked: "2025-03-15",
    cost: 45.00
  },
  {
    id: "4",
    name: "Printer Paper",
    category: "Office",
    currentCount: 2,
    totalCount: 10,
    threshold: 3,
    course: "All",
    lastRestocked: "2025-04-12",
    cost: 5.25
  },
  {
    id: "5",
    name: "USB Flash Drives",
    category: "Electronics",
    currentCount: 12,
    totalCount: 25,
    threshold: 8,
    course: "CS101",
    lastRestocked: "2025-03-28",
    cost: 8.99
  },
  {
    id: "6",
    name: "Lab Coats",
    category: "Lab",
    currentCount: 15,
    totalCount: 20,
    threshold: 5,
    course: "CS202",
    lastRestocked: "2025-02-20",
    cost: 24.50
  },
  {
    id: "7",
    name: "Safety Goggles",
    category: "Lab",
    currentCount: 18,
    totalCount: 25,
    threshold: 10,
    course: "CS202",
    lastRestocked: "2025-02-20",
    cost: 6.75
  },
];

const mockExpenses: Expense[] = [
  {
    id: "1",
    date: "2025-04-15",
    description: "Whiteboard Markers (4 packs)",
    amount: 28.00,
    category: "Office Supplies",
    course: "All",
    receipt: true
  },
  {
    id: "2",
    date: "2025-04-12",
    description: "Printer Paper (5 reams)",
    amount: 26.25,
    category: "Office Supplies",
    course: "All",
    receipt: true
  },
  {
    id: "3",
    date: "2025-04-05",
    description: "Lab Notebooks (15)",
    amount: 52.50,
    category: "Lab Supplies",
    course: "CS202",
    receipt: true
  },
  {
    id: "4",
    date: "2025-03-30",
    description: "Student Project Materials",
    amount: 124.75,
    category: "Project Supplies",
    course: "CS404",
    receipt: false
  },
  {
    id: "5",
    date: "2025-03-28",
    description: "USB Flash Drives (10)",
    amount: 89.90,
    category: "Electronics",
    course: "CS101",
    receipt: true
  },
  {
    id: "6",
    date: "2025-03-15",
    description: "Raspberry Pi Kits (5)",
    amount: 225.00,
    category: "Electronics",
    course: "CS404",
    receipt: true
  },
];

const SuppliesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");
  
  // Filter supplies based on search query
  const filteredSupplies = mockSupplies.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.course.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter expenses based on search query
  const filteredExpenses = mockExpenses.filter(expense => 
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.course.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate warning items
  const warningItems = mockSupplies.filter(item => item.currentCount <= item.threshold);
  
  // Sort supplies by current/total ratio (ascending)
  filteredSupplies.sort((a, b) => (a.currentCount / a.totalCount) - (b.currentCount / b.totalCount));
  
  // Calculate total expenses
  const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Supplies & Expenses</h1>
            <p className="text-muted-foreground">Track your classroom supplies and expenses</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Shopping List</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="glassmorphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{warningItems.length}</div>
                  <p className="text-sm text-muted-foreground">Items below threshold</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                  <PackageOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{mockSupplies.length}</div>
                  <p className="text-sm text-muted-foreground">Different items tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-accent/10 text-accent">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-bold">${totalExpenses.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Semester to date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search items..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              <span>Filter</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="inventory" onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <PackageOpen className="h-4 w-4" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle>Supply Inventory</CardTitle>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Sort</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSupplies.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSupplies.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.course}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={item.currentCount <= item.threshold ? "text-destructive font-bold" : ""}>
                                {item.currentCount}/{item.totalCount}
                              </span>
                              <Progress 
                                value={(item.currentCount / item.totalCount) * 100} 
                                className="w-20 h-2"
                                aria-label="Stock level"
                              />
                              {item.currentCount <= item.threshold && (
                                <Badge variant="destructive" className="text-xs">Low</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Update Stock</DropdownMenuItem>
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem>Add to Shopping List</DropdownMenuItem>
                                <DropdownMenuItem>View History</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">No items found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or add new items</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Item</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle>Expense Tracker</CardTitle>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Sort</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map(expense => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            {new Date(expense.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{expense.description}</div>
                          </TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.course}</TableCell>
                          <TableCell>${expense.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {expense.receipt ? (
                              <CheckCircle className="h-4 w-4 text-secondary" />
                            ) : (
                              <span className="text-xs text-muted-foreground">Missing</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Upload Receipt</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">No expenses found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or add a new expense</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Expense</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SuppliesPage;
