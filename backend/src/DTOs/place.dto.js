// place.dto.js — controls what place data is sent to client per use case

// map markers — sirf pin render garna chainey fields
export const MapPlaceDTO = (place) => ({
    id:          place.id,
    name:        place.name,
    lat:         place.lat,
    lng:         place.lng,
    image:       place.image,
    category:    place.category,
    description: place.description,
    is_featured: place.is_featured,
  });
  
  // home page featured cards — image ra description pani chahincha
  export const FeaturedPlaceDTO = (place) => ({
    id:          place.id,
    name:        place.name,
    lat:         place.lat,
    lng:         place.lng,
    image:       place.image,
    category:    place.category,
    address:     place.address,
    description: place.description,
    is_featured: place.is_featured,
  });
  
  // place detail page — sabai fields chahincha
  export const PlaceDetailDTO = (place) => ({
    id:           place.id,
    name:         place.name,
    lat:          place.lat,
    lng:          place.lng,
    image:        place.image,
    category:     place.category,
    address:      place.address,
    description:  place.description,
    is_featured:  place.is_featured,
    status:       place.status,
    created_at:   place.created_at,
    submitter:    place.submitter ? {
      id:         place.submitter.id,
      first_name: place.submitter.first_name,
      last_name:  place.submitter.last_name,
    } : null,
  });
  
  // my places list — status dekhaucha (pending/approved/rejected)
  export const MyPlaceDTO = (place) => ({
    id:         place.id,
    name:       place.name,
    image:      place.image,
    category:   place.category,
    status:     place.status,
    created_at: place.created_at,
  });