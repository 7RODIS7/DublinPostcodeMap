import type { DistrictSubarea } from '../types/districts'

function neighborhood(
  id: string,
  name: string,
  districtId: string,
  coordinates?: [number, number],
  note?: string,
): DistrictSubarea {
  return {
    id,
    name,
    districtId,
    kind: 'neighborhood',
    coordinates,
    note,
  }
}

function street(
  id: string,
  name: string,
  districtId: string,
  coordinates?: [number, number],
  note?: string,
): DistrictSubarea {
  return {
    id,
    name,
    districtId,
    kind: 'street',
    coordinates,
    note,
  }
}

export const districtSubareas: DistrictSubarea[] = [
  street('abbey-street', 'Abbey Street', 'dublin-1', [53.3485, -6.2588]),
  street('capel-street', 'Capel Street', 'dublin-1', [53.3476, -6.2685]),
  street('henry-street', 'Henry Street', 'dublin-1', [53.3498, -6.2623]),
  street('talbot-street', 'Talbot Street', 'dublin-1', [53.3504, -6.2563]),
  neighborhood('mountjoy-square', 'Mountjoy Square', 'dublin-1', [53.3568, -6.2571]),
  neighborhood('north-wall', 'North Wall', 'dublin-1', [53.3498, -6.2357]),
  neighborhood('parnell-square', 'Parnell Square', 'dublin-1', [53.3539, -6.2645]),

  street('grafton-street', 'Grafton Street', 'dublin-2', [53.3407, -6.2608]),
  street('dawson-street', 'Dawson Street', 'dublin-2', [53.3423, -6.258]),
  street('nassau-street', 'Nassau Street', 'dublin-2', [53.3433, -6.2592]),
  neighborhood('temple-bar', 'Temple Bar', 'dublin-2', [53.3455, -6.2642]),
  neighborhood('trinity-college', 'Trinity College area', 'dublin-2', [53.3438, -6.2546]),
  neighborhood('st-stephens-green', "St Stephen's Green", 'dublin-2', [53.3381, -6.2592]),
  street('pearse-street', 'Pearse Street', 'dublin-2', [53.3444, -6.2458]),

  neighborhood('dollymount', 'Dollymount', 'dublin-3', [53.3665, -6.1664]),
  neighborhood('clonliffe', 'Clonliffe', 'dublin-3', [53.365, -6.2533]),
  neighborhood('clontarf', 'Clontarf', 'dublin-3', [53.3638, -6.2008]),
  neighborhood('fairview', 'Fairview', 'dublin-3', [53.363, -6.2405]),
  neighborhood('marino', 'Marino', 'dublin-3', [53.3667, -6.2361]),
  neighborhood('east-wall', 'East Wall', 'dublin-3', [53.3513, -6.2316]),

  neighborhood('ballsbridge', 'Ballsbridge', 'dublin-4', [53.3282, -6.2295]),
  neighborhood('donnybrook', 'Donnybrook', 'dublin-4', [53.3212, -6.2382]),
  neighborhood('merrion', 'Merrion', 'dublin-4', [53.3177, -6.2092]),
  neighborhood('pembroke', 'Pembroke', 'dublin-4', [53.3263, -6.2253]),
  neighborhood('ringsend', 'Ringsend', 'dublin-4', [53.3414, -6.2214]),
  neighborhood('sandymount', 'Sandymount', 'dublin-4', [53.3297, -6.2114]),

  neighborhood('artane', 'Artane', 'dublin-5', [53.3874, -6.2143]),
  neighborhood('harmonstown', 'Harmonstown', 'dublin-5', [53.3784, -6.1924]),
  neighborhood('raheny', 'Raheny', 'dublin-5', [53.3806, -6.1756]),
  neighborhood('coolock', 'Coolock', 'dublin-5', [53.3903, -6.2014]),
  neighborhood('killester', 'Killester', 'dublin-5', [53.3738, -6.2048]),

  neighborhood('ranelagh', 'Ranelagh', 'dublin-6', [53.3268, -6.2524]),
  neighborhood('rathmines', 'Rathmines', 'dublin-6', [53.3231, -6.2655]),
  neighborhood('rathgar', 'Rathgar', 'dublin-6', [53.3145, -6.2747]),
  neighborhood('milltown', 'Milltown', 'dublin-6', [53.3104, -6.251]),

  neighborhood('harolds-cross', "Harold's Cross", 'dublin-6w', [53.3206, -6.2817]),
  neighborhood('kimmage', 'Kimmage', 'dublin-6w', [53.3162, -6.2957]),
  neighborhood('terenure', 'Terenure', 'dublin-6w', [53.3096, -6.2854]),
  neighborhood('templeogue', 'Templeogue', 'dublin-6w', [53.2982, -6.3166]),

  neighborhood('ashtown', 'Ashtown', 'dublin-7', [53.3668, -6.3194]),
  neighborhood('cabra', 'Cabra', 'dublin-7', [53.3636, -6.2962]),
  neighborhood('phibsborough', 'Phibsborough', 'dublin-7', [53.3603, -6.2724]),
  neighborhood('smithfield', 'Smithfield', 'dublin-7', [53.3472, -6.2781]),
  neighborhood('stoneybatter', 'Stoneybatter', 'dublin-7', [53.3499, -6.2854]),

  neighborhood('inchicore', 'Inchicore', 'dublin-8', [53.3388, -6.3172]),
  neighborhood('kilmainham', 'Kilmainham', 'dublin-8', [53.3427, -6.3077]),
  neighborhood('portobello', 'Portobello', 'dublin-8', [53.3316, -6.2656]),
  neighborhood('the-coombe', 'The Coombe', 'dublin-8', [53.3398, -6.2758]),

  neighborhood('drumcondra', 'Drumcondra', 'dublin-9', [53.3691, -6.2527]),
  neighborhood('santry', 'Santry', 'dublin-9', [53.3928, -6.2513]),
  neighborhood('beaumont', 'Beaumont', 'dublin-9', [53.3906, -6.2235]),
  neighborhood('whitehall', 'Whitehall', 'dublin-9', [53.3842, -6.2555]),

  neighborhood('ballyfermot', 'Ballyfermot', 'dublin-10', [53.3425, -6.3542]),
  neighborhood('cherry-orchard', 'Cherry Orchard', 'dublin-10', [53.3412, -6.3773]),
  neighborhood('park-west', 'Park West', 'dublin-10', [53.3412, -6.3777]),
  street('sarsfield-road', 'Sarsfield Road', 'dublin-10', [53.3425, -6.3312]),

  neighborhood('finglas', 'Finglas', 'dublin-11', [53.3898, -6.2963]),
  neighborhood('ballymun', 'Ballymun', 'dublin-11', [53.3976, -6.2653]),
  neighborhood('glasnevin', 'Glasnevin', 'dublin-11', [53.3785, -6.2801]),
  neighborhood('jamestown', 'Jamestown', 'dublin-11', [53.3972, -6.2851]),

  neighborhood('crumlin', 'Crumlin', 'dublin-12', [53.3219, -6.3164]),
  neighborhood('walkinstown', 'Walkinstown', 'dublin-12', [53.3182, -6.3256]),
  neighborhood('drimnagh', 'Drimnagh', 'dublin-12', [53.3342, -6.3285]),
  neighborhood('bluebell', 'Bluebell', 'dublin-12', [53.3298, -6.3334]),

  neighborhood('howth', 'Howth', 'dublin-13', [53.3876, -6.0653]),
  neighborhood('sutton', 'Sutton', 'dublin-13', [53.3898, -6.1088]),
  neighborhood('baldoyle', 'Baldoyle', 'dublin-13', [53.3987, -6.1271]),
  neighborhood('donaghmede', 'Donaghmede', 'dublin-13', [53.3987, -6.1617]),
  neighborhood('portmarnock', 'Portmarnock', 'dublin-13', [53.4177, -6.1513]),

  neighborhood('dundrum', 'Dundrum', 'dublin-14', [53.2901, -6.2453]),
  neighborhood('churchtown', 'Churchtown', 'dublin-14', [53.3008, -6.2543]),
  neighborhood('clonskeagh', 'Clonskeagh', 'dublin-14', [53.3132, -6.2408]),
  neighborhood('goatstown', 'Goatstown', 'dublin-14', [53.2997, -6.2416]),

  neighborhood('blanchardstown', 'Blanchardstown', 'dublin-15', [53.3882, -6.3755]),
  neighborhood('castleknock', 'Castleknock', 'dublin-15', [53.3742, -6.3632]),
  neighborhood('clonsilla', 'Clonsilla', 'dublin-15', [53.3892, -6.4246]),
  neighborhood('coolmine', 'Coolmine', 'dublin-15', [53.3777, -6.3906]),
  neighborhood('ongar', 'Ongar', 'dublin-15', [53.3942, -6.4389]),

  neighborhood('ballinteer', 'Ballinteer', 'dublin-16', [53.2751, -6.2544]),
  neighborhood('ballyboden', 'Ballyboden', 'dublin-16', [53.2807, -6.2905]),
  neighborhood('knocklyon', 'Knocklyon', 'dublin-16', [53.2806, -6.316]),
  neighborhood('whitechurch', 'Whitechurch', 'dublin-16', [53.2525, -6.272]),

  neighborhood('clonshaugh', 'Clonshaugh', 'dublin-17', [53.4028, -6.2262]),
  neighborhood('balgriffin', 'Balgriffin', 'dublin-17', [53.4064, -6.178]),
  neighborhood('belcamp', 'Belcamp', 'dublin-17', [53.4057, -6.1836]),
  neighborhood('darndale', 'Darndale', 'dublin-17', [53.4008, -6.1946]),
  neighborhood('priorswood', 'Priorswood', 'dublin-17', [53.3998, -6.2143]),

  neighborhood('sandyford', 'Sandyford', 'dublin-18', [53.2746, -6.2166]),
  neighborhood('cabinteely', 'Cabinteely', 'dublin-18', [53.2613, -6.1506]),
  neighborhood('foxrock', 'Foxrock', 'dublin-18', [53.2665, -6.1748]),
  neighborhood('beech-park', 'Beech Park', 'dublin-18', [53.2739, -6.1678]),
  neighborhood('leopardstown', 'Leopardstown', 'dublin-18', [53.2665, -6.2031]),
  neighborhood('carrickmines', 'Carrickmines', 'dublin-18', [53.2525, -6.1844]),
  neighborhood('shanganagh-vale', 'Shanganagh Vale', 'dublin-18', [53.2526, -6.1404]),
  neighborhood('wyattville', 'Wyattville', 'dublin-18', [53.2505, -6.1388]),
  neighborhood('stepaside', 'Stepaside', 'dublin-18', [53.2531, -6.2144]),

  neighborhood('chapelizod', 'Chapelizod', 'dublin-20', [53.3487, -6.3433]),
  neighborhood('palmerstown', 'Palmerstown', 'dublin-20', [53.3507, -6.3779]),

  neighborhood('clondalkin', 'Clondalkin', 'dublin-22', [53.3248, -6.3957]),
  neighborhood('neilstown', 'Neilstown', 'dublin-22', [53.3365, -6.4052]),
  neighborhood('bawnogue', 'Bawnogue', 'dublin-22', [53.3268, -6.4119]),
  neighborhood('newcastle', 'Newcastle', 'dublin-22', [53.3018, -6.502]),

  neighborhood('tallaght', 'Tallaght', 'dublin-24', [53.2861, -6.373]),
  neighborhood('firhouse', 'Firhouse', 'dublin-24', [53.2815, -6.3387]),
  neighborhood('jobstown', 'Jobstown', 'dublin-24', [53.2817, -6.4082]),
  neighborhood('kilnamanagh', 'Kilnamanagh', 'dublin-24', [53.2934, -6.3645]),
  neighborhood('oldbawn', 'Old Bawn', 'dublin-24', [53.279, -6.3572]),

  neighborhood('blackrock', 'Blackrock', 'routing-a94', [53.3015, -6.1778]),
  neighborhood('booterstown', 'Booterstown', 'routing-a94', [53.3049, -6.1995]),
  neighborhood('stillorgan', 'Stillorgan', 'routing-a94', [53.2906, -6.1983]),
  neighborhood('deansgrange', 'Deansgrange', 'routing-a94', [53.2852, -6.1647]),

  neighborhood('dun-laoghaire', 'Dun Laoghaire', 'routing-a96', [53.2943, -6.1349]),
  neighborhood('glenageary', 'Glenageary', 'routing-a96', [53.2869, -6.1287]),
  neighborhood('sallynoggin', 'Sallynoggin', 'routing-a96', [53.2809, -6.1388]),
  neighborhood('loughlinstown', 'Loughlinstown', 'routing-a96', [53.2457, -6.1314]),

  neighborhood('balbriggan', 'Balbriggan', 'routing-k32', [53.6119, -6.1831]),
  neighborhood('balrothery', 'Balrothery', 'routing-k32', [53.5888, -6.1874]),

  neighborhood('skerries', 'Skerries', 'routing-k34', [53.5818, -6.1091]),

  neighborhood('malahide', 'Malahide', 'routing-k36', [53.4509, -6.1545]),

  neighborhood('lusk', 'Lusk', 'routing-k45', [53.5264, -6.1645]),

  neighborhood('rush', 'Rush', 'routing-k56', [53.5236, -6.0932]),

  neighborhood('swords', 'Swords', 'routing-k67', [53.4597, -6.2181]),
  neighborhood('airside', 'Airside', 'routing-k67', [53.4488, -6.2209]),
  neighborhood('river-valley', 'River Valley', 'routing-k67', [53.4468, -6.2085]),

  neighborhood('lucan', 'Lucan', 'routing-k78', [53.3571, -6.4486]),
  neighborhood('adamstown', 'Adamstown', 'routing-k78', [53.3369, -6.4599]),

  neighborhood('ballyboughal', 'Ballyboughal', 'routing-a41', [53.5232, -6.2661]),

  neighborhood('garristown', 'Garristown', 'routing-a42', [53.5379, -6.3813]),

  neighborhood('oldtown', 'Oldtown', 'routing-a45', [53.5129, -6.3176]),
]
