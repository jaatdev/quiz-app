import { Card, CardContent } from '@/components/ui/card';

export function Testimonials() {
  const items = [
    { name: 'Aman', text: "Best quiz UI I've used. PYQ tags are a game changer." },
    { name: 'Priya', text: 'Clean, fast, and addictive. Love the analytics.' },
    { name: 'Rahul', text: 'Admin import + structure saved me hours.' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((testimonial, index) => (
        <Card key={`${testimonial.name}-${index}`} className="bg-white/80 backdrop-blur dark:bg-gray-900/80">
          <CardContent className="p-5">
            <p className="text-gray-900 dark:text-gray-100">"{testimonial.text}"</p>
            <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">— {testimonial.name}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
