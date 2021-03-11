select _objects_id.external_id, _objects_attr.name, _objects_attr.category, _objects_attr.data_type, _objects_attr.data_type_context, _objects_val.value
from _objects_eav
left join _objects_id on _objects_id.id = _objects_eav.entity_id
left join _objects_attr on _objects_attr.id = _objects_eav.attribute_id
left join _objects_val on _objects_val.id = _objects_eav.value_id
order by _objects_eav.entity_id;