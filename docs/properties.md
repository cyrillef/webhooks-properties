# Property Server

The propertyServer server exercises a workaround to the Forge Model Derivative API limitations of the [request properties](https://developer.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-properties-GET/) endpoint such as object queries or quota limits. It also demonstrates how to parse the bubble json.gz property files.

Currently limited to the SVF format.

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties/:urn/details</div>
Returns information about the cached database.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

Example

```bash
curl -X GET http://localhost:3001/properties/dx...Z0/details
```

Response - 200

```json
{
  "data": {
    "type": "details",
    "maxId": 3277,
    "dbs": {
      "objects_offs": 7672,
      "objects_avs": 33546,
      "objects_vals": 41173,
      "objects_attrs": 5592,
      "objects_ids": 15981
    }
  }
}
```

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties/:urn/release</div>
Deletes the cached database from the server.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

Example

```bash
curl -X GET http://localhost:3001/properties/dx...Z0/release
```

Response - 202

```json
{
  "status": "success"
}
```

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties/:urn/externalids</div>
Returns a list of externalID from requested dbID.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* ids {string} - Lsit of dbID. CSV formatted, using ',' separator. Range separator is '-'.

Example

```bash
curl -X GET http://localhost:3001/properties/dx...Z0/externalids?ids=2824,2830,3270-3277,5
```

Response - 200

```json
{
  "data": {
    "type": "externalIds",
    "collection": {
      "5": "c8923f5e-6a14-4420-9b1d-c31d7ae067d2-00000024",
      "2824": "8c37f8e7-439b-4711-81a8-8b795a6ead1a",
      "2830": "f916c358-f9a7-4a53-8525-49f6ae53aeaa-0004b84b",
      "3270": "425fa4b5-cf64-4260-8581-2345290e5c67-0005832d",
      "3271": "425fa4b5-cf64-4260-8581-2345290e5c67-0005833a",
      "3272": "425fa4b5-cf64-4260-8581-2345290e5c67-0005833c",
      "3273": "425fa4b5-cf64-4260-8581-2345290e5c67-0005833d",
      "3274": "425fa4b5-cf64-4260-8581-2345290e5c67-0005833e",
      "3275": "425fa4b5-cf64-4260-8581-2345290e5c67-00058340",
      "3276": "425fa4b5-cf64-4260-8581-2345290e5c67-00058341",
      "3277": "425fa4b5-cf64-4260-8581-2345290e5c67-00058342"
    }
  }
}
```

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties/:urn/ids</div>
Returns a list of dbId from requested externalID.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* ids {string} - List of externalID. CSV formatted, using ',' separator.

Example

```bash
curl -X GET http://localhost:3001/properties/dx...Z0/ids?ids=c8923f5e-6a14-4420-9b1d-c31d7ae067d2-00000024,425fa4b5-cf64-4260-8581-2345290e5c67-0005833c
```

Response - 200

```json
{
  "data": {
    "type": "objectids",
    "collection": {
      "c8923f5e-6a14-4420-9b1d-c31d7ae067d2-00000024": 5,
      "425fa4b5-cf64-4260-8581-2345290e5c67-0005833c": 3272
    }
  }
}
```

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties/:urn/forge</div>
Returns a list of properties for each object in an object tree for the default viewable node. Properties are returned according to object ID and do not follow a hierarchical structure.

This endpoint forwards the call to the Forge endpoint, and managed the 202 / 429 conditions.

See [the documentation](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-properties-GET/) for more details.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* objectid {long, optional} - Object id which you want to query properties for. If objectid is omitted, the server will return properties for all objects.

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties//:urn/guids/:guid/forge</div>
Returns a list of properties for each object in an object tree. Properties are returned according to object ID and do not follow a hierarchical structure.

This endpoint forwards the call to the Forge endpoint, and managed the 202 / 429 conditions.

See [the documentation](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-properties-GET/) for more details.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

* guid {string} - Unique model view ID. Call [GET :urn/metadata](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET) to get the ID.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* objectid {long, optional} - Object id which you want to query properties for. If objectid is omitted, the server will return properties for all objects.

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties/:urn</div>
Returns a list of properties for each object in an object tree for the default viewable node. Properties are returned according to object ID and do not follow a hierarchical structure.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* ids {string} - Lsit of dbID. CSV formatted, using ',' separator. Range separator is '-'.

* keepinternals (boolean, optional) - Outputs internal references if true - default is false.

Example

```bash
curl -X GET http://localhost:3001/properties/dx...Z0?ids=2824,2828
```

Response - 200

```json
{
  "data": {
    "type": "properties",
    "collection": [
      {
        "objectid": 2824,
        "name": "Walls",
        "externalId": "8c37f8e7-439b-4711-81a8-8b795a6ead1a",
        "properties": {}
      },
      {
        "objectid": 2828,
        "name": "Basic Wall [309068]",
        "externalId": "f916c358-f9a7-4a53-8525-49f6ae53aeaa-0004b74c",
        "properties": {
          "Analytical Properties": {
            "Absorptance": "0.700 ",
            "Heat Transfer Coefficient (U)": "0.7754 btu / (hour ft^2 degF)",
            "Roughness": "3 ",
            "Thermal Resistance (R)": "1.2897 hour ft^2 degF / (btu)",
            "Thermal mass": "21.8404 btu/degF"
          },
          // ...
        }
      }
    ]
  }
}
```

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /properties/:urn/guids/:guid</div>
Returns a list of properties for each object in an object tree. Properties are returned according to object ID and do not follow a hierarchical structure.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

* guid {string} - Unique model view ID. Call [GET :urn/metadata](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET) to get the ID.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* ids {string} - Lsit of dbID. CSV formatted, using ',' separator. Range separator is '-'.

* keepinternals (boolean, optional) - Outputs internal references if true - default is false.

Example

```bash
curl -X GET http://localhost:3001/properties/dx...Z0/guids/1234-...-4321?ids=2824,2828
```

Response - 200

```json
{
  "data": {
    "type": "properties",
    "collection": [
      {
        "objectid": 2824,
        "name": "Walls",
        "externalId": "8c37f8e7-439b-4711-81a8-8b795a6ead1a",
        "properties": {}
      },
      {
        "objectid": 2828,
        "name": "Basic Wall [309068]",
        "externalId": "f916c358-f9a7-4a53-8525-49f6ae53aeaa-0004b74c",
        "properties": {
          "Analytical Properties": {
            "Absorptance": "0.700 ",
            "Heat Transfer Coefficient (U)": "0.7754 btu / (hour ft^2 degF)",
            "Roughness": "3 ",
            "Thermal Resistance (R)": "1.2897 hour ft^2 degF / (btu)",
            "Thermal mass": "21.8404 btu/degF"
          },
          // ...
        }
      }
    ]
  }
}
```

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /tree/:urn/forge</div>
Returns an object tree, i.e., a hierarchical list of objects for the default model view.

This endpoint forwards the call to the Forge endpoint, and managed the 202 / 429 conditions.

See [the documentation](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-GET/) for more details.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.


<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /tree/:urn/guids/:guid/forge</div>
Returns an object tree, i.e., a hierarchical list of objects for the model view.

This endpoint forwards the call to the Forge endpoint, and managed the 202 / 429 conditions.

See [the documentation](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-GET/) for more details.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

* guid {string} - Unique model view ID. Call [GET :urn/metadata](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET) to get the ID.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /tree/:urn</div>
Returns an object tree, i.e., a hierarchical list of objects for the model view.

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* properties {string, optional} - Includes properties in the tree, Default is false.

Example

```bash
curl -X GET "http://localhost:3001/tree/dx...Z0"
```

Response - 200

```json
{
  "data": {
    "type": "objects",
    "objects": [
      {
        "objectid": 1,
        "name": "Model",
        "objects": [
          {
            "objectid": 2824,
            "name": "Walls",
            "objects": [
              {
                "objectid": 2825,
                "name": "Basic Wall",
                "objects": [
                  {
                    "objectid": 2827,
                    "name": "Generic - 12\" Masonry",
                    "objects": [
                      {
                        "objectid": 2828,
                        "name": "Basic Wall [309068]"
                      },
                      // ...

```

<div style="color: white; background-color: gray; padding: 10px; width: 100%;">GET /tree/:urn/guids/:guid</div>

URI Parameters

* urn {string} - The Base64 (URL Safe) encoded design URN.

* guid {string} - Unique model view ID. Call [GET :urn/metadata](https://forge.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET) to get the ID.

Query String Parameters

* region {string, optional} - Model Derivative proxy Region. Possible values: US, EMEA. By default, it is set to US, and unless you are using a BIM360 EMEA Hub, it is recommended to leave it to US.

* properties {string, optional} - Includes properties in the tree, Default is false.

Example

```bash
curl -X GET "http://localhost:3001/tree/dx...Z0/guids/1234-...-4321"
```

Response - 200

```json
{
  "data": {
    "type": "objects",
    "objects": [
      {
        "objectid": 1,
        "name": "Model",
        "objects": [
          {
            "objectid": 2824,
            "name": "Walls",
            "objects": [
              {
                "objectid": 2825,
                "name": "Basic Wall",
                "objects": [
                  {
                    "objectid": 2827,
                    "name": "Generic - 12\" Masonry",
                    "objects": [
                      {
                        "objectid": 2828,
                        "name": "Basic Wall [309068]"
                      },
                      // ...

```