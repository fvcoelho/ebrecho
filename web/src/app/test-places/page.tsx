'use client';

import { PlacesAutocomplete } from '@/components/places/places-autocomplete';

export default function TestPlacesPage() {
  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Test PlacesAutocomplete</h1>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Test Location Search
            </label>
            <PlacesAutocomplete
              placeholder="Digite um endereço para testar..."
              onLocationSelect={(location) => {
                console.log('Location selected:', location);
                alert(`Location: ${location.address}\nLat: ${location.lat}\nLng: ${location.lng}`);
              }}
              onPlaceSelect={(place) => {
                console.log('Place selected:', place);
                alert(`Place: ${place.name}\nPhone: ${place.formatted_phone_number}`);
              }}
              types={['geocode']}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Open browser console to see API calls and responses.</p>
          <p>Try typing "São Paulo" or "McDonald" to test.</p>
        </div>
      </div>
    </div>
  );
}