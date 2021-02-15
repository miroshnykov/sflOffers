let dbMysql = require('./mysqlAdcenterDb').get()

const getSegments = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT 
                  s.position AS segmentPosition, 
                  vsd.position AS conditionPosition, 
                  s.name AS name, 
                  s.id AS segmentId, 
                  (select COUNT(*)  from sfl_segment_dimension where sfl_segment_id = s.id) AS countConditionsBySegment,
                  vsd.segment_rule_index AS segmentRuleIndex, 
                  vd.name AS dimension, 
                  vsd.value AS value, 
                  vsd.filter_type_id AS include, 
                  vsd.match_type_id AS matchTypeId, 
                  vd.id AS dimensionid, 
                  s.type AS segmentType
            FROM 
                  sfl_segment AS s 
                  LEFT JOIN (
                    sfl_segment_dimension AS vsd, sfl_dimension AS vd
                  ) ON (
                    vsd.sfl_segment_id = s.id 
                    AND vsd.sfl_dimension_id = vd.id
                  ) 
            WHERE 
                  s.id IN (
                    SELECT 
                      sfl_segment_id 
                    FROM 
                      sfl_segment_dimension
                  ) 
              AND s.status = 'active' 
            ORDER BY 
              s.position ASC, 
              vsd.segment_rule_index, 
              vsd.position

        `)
        await dbMysql.end()

        console.log(`\nget all active Segments count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}


module.exports = {
    getSegments,
}