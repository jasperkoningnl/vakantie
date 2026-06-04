export type PlaceCategory=
  | 'lake'
  | 'woods'
  | 'castle'
  | 'village'
  | 'playground'
  | 'restaurant'
  | 'patisserie'
  | 'zoo'
  | 'amusement_park'
  | 'park'
  | 'supermarket'
  | 'pharmacy'
  | 'hospital'
  | 'dentist'
  | 'fuel'
  | 'stay'
  | 'route_stop';
export type Coordinates=[number,number];
export type LinkSet={googleMaps?:string;official?:string;wikipedia?:string;tickets?:string;openingHours?:string};
export type DistanceGroup='20min'|'45min'|'60min'|'120min';
export type Place={id:string;name:string;category:PlaceCategory;description:string;whyGo:string;readAloudSummary?:string;goodFor:string[];notIdealFor?:string[];coordinates?:Coordinates;address?:string;driveTimeMinutes?:number;distanceGroup:DistanceGroup;preschoolSuitable:boolean;lenaScore?:1|2|3|4|5;indoor?:boolean;shade?:boolean;waterNearby?:boolean;rainyDay?:boolean;hotDay?:boolean;vegetarianFriendly?:boolean;foodNearby?:string;combineWith?:string[];practicalNotes?:string;verificationStatus:'checked'|'todo';links:LinkSet};
export type StayPeriod={dates:string;name:string;notes:string[]};
export type Contact={name:string;role?:string;phone?:string;mobile?:string;email?:string;website?:string;address:string[];sourceNote?:string};
export type RouteStop={id:string;date:string;title:string;from:string;to:string;overnight?:Contact;notes:string[];todos:string[]};
export type ChecklistGroup={id:string;title:string;items:string[]};
export type WeatherNow={temperature:number;code:number;windSpeed:number;precipitationProbability:number;tempMin:number;tempMax:number};
export type ArchiveEntry={name:string;summary:string;whyArchived:string};
export type DayStop={id:string;placeId?:string;customTitle?:string;type:'outing'|'supermarket'|'fuel'|'restaurant'|'patisserie'|'playground'|'viewpoint'|'medical'|'custom';timing?:'morning'|'lunch'|'afternoon'|'evening'|'on_the_way';notes?:string;completed?:boolean};
export type DayPlan={id:string;date?:string;title:string;mood?:string;mainStopId?:string;stops:DayStop[];notes?:string;createdAt:string;updatedAt:string};
export type DayPhoto={id:string;source:'local'|'url';url:string;caption?:string};
export type DiaryEntry={id:string;date:string;title?:string;sourceDayPlanId?:string;placeIds:string[];weatherSummary?:string;notes:string;favouriteMoment?:string;lenaMoment?:string;foodNotes?:string;photos?:DayPhoto[];createdAt:string;updatedAt:string};
export type Mood={id:string;label:string;description:string;matcher:(place:Place)=>boolean};
