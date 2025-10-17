-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN (
      'admin',
      'collaborator',
      'normal_user'
    )) DEFAULT 'normal_user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- 2. CITIES TABLE
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name JSONB NOT NULL CHECK (jsonb_typeof(name) = 'object'),
    address JSONB CHECK (address IS NULL OR jsonb_typeof(address) = 'object'),
    description JSONB CHECK (description IS NULL OR jsonb_typeof(description) = 'object'),
    image_urls TEXT[],
    geom GEOGRAPHY(POINT, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2a. CITY DETAILS (rich content blocks)
CREATE TABLE IF NOT EXISTS city_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    predefined_title VARCHAR(100) NOT NULL CHECK (predefined_title IN (
        'introduction_and_history',
        'geography',
        'climate_and_environment',
        'demographics',
        'administrative_info',
        'economic_info',
        'social_info',
        'religious_info',
        'development_info',
        'general'
    )),
    subtitle JSONB CHECK (subtitle IS NULL OR jsonb_typeof(subtitle) = 'object'),
    body JSONB NOT NULL CHECK (jsonb_typeof(body) = 'object'),
    image_urls TEXT[],
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_city_detail_predefined_title UNIQUE (city_id, predefined_title)
);

-- 3. LOCATIONS (Points of Interest)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name JSONB NOT NULL CHECK (jsonb_typeof(name) = 'object'),
    address JSONB CHECK (address IS NULL OR jsonb_typeof(address) = 'object'),
    description JSONB CHECK (description IS NULL OR jsonb_typeof(description) = 'object'),
    image_urls TEXT[],
    geom GEOGRAPHY(POINT, 4326) NOT NULL,
    location_type VARCHAR(30) CHECK (location_type IN (
        'hospital',
        'police_station',
        'fire_station',
        'post_office',
        'government_office',
        'embassy',
        'bus_stop',
        'train_station',
        'airport',
        'parking_lot',
        'gas_station',
        'harbor',
        'restaurant',
        'cafe',
        'bar',
        'cinema',
        'stadium',
        'sports_center',
        'park',
        'zoo',
        'amusement_park',
        'store',
        'market',
        'mall',
        'supermarket',
        'bank',
        'hotel',
        'pharmacy',
        'beauty_salon',
        'laundry',
        'school',
        'university',
        'library',
        'museum',
        'pagoda',
        'temple',
        'church',
        'mosque',
        'apartment',
        'residential_area',
        'factory',
        'warehouse',
        'farm',
        'cemetery',
        'landmark',
        'intersection',
        'office',
        'monastery',
        'other'
    )),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_location_point UNIQUE (geom)
);

-- 4. ROADS TABLE
CREATE TABLE IF NOT EXISTS roads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name JSONB NOT NULL CHECK (jsonb_typeof(name) = 'object'),
    geom GEOGRAPHY(LINESTRING, 4326) NOT NULL,
    length_m DOUBLE PRECISION[] NOT NULL,
    road_type VARCHAR(20) CHECK(road_type IN (
      'highway',
      'local_road',
      'residential_road',
      'bridge',
      'tunnel'
    )),
    is_oneway BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_linestring CHECK (ST_GeometryType(geom::geometry) = 'ST_LineString')
);

-- 5. ROUTE REQUESTS
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_loc GEOGRAPHY(POINT, 4326) NOT NULL,
    end_loc GEOGRAPHY(POINT, 4326) NOT NULL,
    total_distance_m FLOAT CHECK (total_distance_m > 0),
    estimated_time_s FLOAT CHECK (estimated_time_s > 0),
    geom GEOGRAPHY(LINESTRING, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_route_linestring CHECK (
        geom IS NULL OR ST_GeometryType(geom::geometry) = 'ST_LineString'
    )
);

-- 6. USER ROUTE HISTORY
CREATE TABLE IF NOT EXISTS user_route_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP DEFAULT NOW(),
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    notes JSONB CHECK (notes IS NULL OR jsonb_typeof(notes) = 'object'),
    start_name JSONB CHECK (start_name IS NULL OR jsonb_typeof(start_name) = 'object'),
    end_name JSONB CHECK (end_name IS NULL OR jsonb_typeof(end_name) = 'object'),
    total_distance_m FLOAT,
    duration_min FLOAT
);

-- 7. APPROVAL REQUESTS (for collaborator workflow)
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN (
        'city',
        'city_detail',
        'location',
        'road'
    )),
    entity_id UUID NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN (
        'create',
        'update',
        'delete',
        'activate'
    )),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'approved',
        'rejected',
        'cancelled'
    )),
    request_data JSONB,
    review_notes TEXT,
    requested_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_preferences_gin ON users USING GIN (preferences jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_locations_name_gin ON locations USING GIN (name jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations (location_type);
CREATE INDEX IF NOT EXISTS idx_roads_geom ON roads USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_roads_name_gin ON roads USING GIN (name jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_roads_type ON roads (road_type);
CREATE INDEX IF NOT EXISTS idx_cities_geom ON cities USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_cities_name_gin ON cities USING GIN (name jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities (is_active);
CREATE INDEX IF NOT EXISTS idx_routes_geom ON routes USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_routes_start ON routes USING GIST (start_loc);
CREATE INDEX IF NOT EXISTS idx_routes_end ON routes USING GIST (end_loc);
CREATE INDEX IF NOT EXISTS idx_history_user ON user_route_history (user_id);
CREATE INDEX IF NOT EXISTS idx_history_route ON user_route_history (route_id);
CREATE INDEX IF NOT EXISTS idx_history_start_name_gin ON user_route_history USING GIN (start_name jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_history_end_name_gin ON user_route_history USING GIN (end_name jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_city_details_city ON city_details (city_id);
CREATE INDEX IF NOT EXISTS idx_city_details_title_gin ON city_details USING GIN (title jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_city_details_body_gin ON city_details USING GIN (body jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_city_details_active ON city_details (is_active);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations (is_active);
CREATE INDEX IF NOT EXISTS idx_roads_active ON roads (is_active);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON approval_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_reviewer ON approval_requests (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests (status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_at ON approval_requests (requested_at DESC);

-- trigger to keep city_details.updated_at fresh
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ensure updated_at columns stay current
DROP TRIGGER IF EXISTS trg_users_touch ON users;
CREATE TRIGGER trg_users_touch
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_cities_touch ON cities;
CREATE TRIGGER trg_cities_touch
BEFORE UPDATE ON cities
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_city_details_touch ON city_details;
CREATE TRIGGER trg_city_details_touch
BEFORE UPDATE ON city_details
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_locations_touch ON locations;
CREATE TRIGGER trg_locations_touch
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_roads_touch ON roads;
CREATE TRIGGER trg_roads_touch
BEFORE UPDATE ON roads
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_routes_touch ON routes;
CREATE TRIGGER trg_routes_touch
BEFORE UPDATE ON routes
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_approval_requests_touch ON approval_requests;
CREATE TRIGGER trg_approval_requests_touch
BEFORE UPDATE ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();